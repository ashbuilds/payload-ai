import type { LexicalEditor } from 'lexical'

import { SKIP_SCROLL_INTO_VIEW_TAG } from 'lexical'

import { BLOCK_PLACEHOLDER_PREFIX, BLOCK_PLACEHOLDER_SUFFIX } from './lexicalToHTML.js'

type SetSafeLexicalStateOptions = {
  logErrors?: boolean
  /**
   * Called when committing the state threw. Reconciliation fails mid-render, so the editor is
   * left unable to render anything else and callers that apply repeatedly (streaming) can use
   * this to stop retrying. A state that is merely unparsable does not reach this callback,
   * because it never touched the editor.
   */
  onApplyError?: (error: unknown) => void
  /**
   * Pre-generation snapshot of `root` (as returned by `editorState.toJSON().root`), used to
   * find and reinsert preserved custom blocks. Passing this explicitly (rather than reading the
   * live editor state at call time) matters for streaming generations, which call
   * `setSafeLexicalState` repeatedly as partial content arrives - see `useGenerate.ts` for why
   * that would otherwise compound block position errors on every call.
   */
  originalRoot?: null | Record<string, unknown>
  /**
   * Streaming applies are display updates, not user cursor movement. Without this, Lexical may
   * scroll the current selection back into view on every partial commit.
   */
  skipScrollIntoView?: boolean
}

type LexicalNodeJSON = { children?: LexicalNodeJSON[]; type?: string } & Record<string, unknown>

const nodeTextContent = (node: LexicalNodeJSON | undefined): null | string => {
  // Broadened from paragraph-only: the model may echo the marker back wrapped in a different
  // block type (e.g. a heading) despite the prompt instruction, so match on any node that
  // exposes plain-text children.
  if (!node || !Array.isArray(node.children)) {
    return null
  }
  return node.children
    .filter((child) => child?.type === 'text')
    .map((child) => (typeof child.text === 'string' ? child.text : ''))
    .join('')
    .trim()
}

const findMarkerIndex = (nextChildren: LexicalNodeJSON[], markerIndex: number): number => {
  const marker = `${BLOCK_PLACEHOLDER_PREFIX}${markerIndex}${BLOCK_PLACEHOLDER_SUFFIX}`
  return nextChildren.findIndex((node) => nodeTextContent(node) === marker)
}

/**
 * The generation JSON schema has no entry for Payload's custom `block` node type
 * (BlocksFeature), and the caller always fully replaces `root.children` with the model's
 * output - so any custom blocks in the document would otherwise be silently dropped by every
 * Compose/Translate/Expand/etc. action. Since the model was never given a schema to reproduce
 * these nodes, the only way to keep them is to reinsert them ourselves before committing the
 * new state.
 *
 * Counterpart of the placeholder substitution in `lexicalToHTML.ts`: each preserved block is
 * rendered as a `"[[[BLOCK_<n>]]]"` marker paragraph in the model's prompt context (see
 * `buildBlockPlaceholderInstruction` in `endpoints/index.ts` for the accompanying instruction to
 * echo it back unchanged). If the model cooperated, that marker is found here in the generated
 * content and swapped for the real block at that exact position. If the model altered,
 * translated, or dropped the marker (not guaranteed, since it's only a prompt instruction, not a
 * schema constraint), position falls back to an approximation proportional to the block's
 * original relative index, since the regenerated content no longer has a 1:1 correspondence
 * with the original paragraph/heading count. Only top-level `root.children` are handled - blocks
 * nested inside other node types are out of scope for this pass.
 */
export const reinsertPreservedBlocks = (
  currentRoot: null | Record<string, unknown> | undefined,
  nextChildren: LexicalNodeJSON[],
): LexicalNodeJSON[] => {
  const currentChildren = currentRoot?.children
  if (!Array.isArray(currentChildren)) {
    return nextChildren
  }

  const originalLength = currentChildren.length
  const preservedBlocks = currentChildren
    .map((child: LexicalNodeJSON, index: number) => ({ child, index }))
    .filter(({ child }) => child?.type === 'block')

  if (preservedBlocks.length === 0) {
    return nextChildren
  }

  const merged = [...nextChildren]
  const unmatched: LexicalNodeJSON[] = []

  preservedBlocks.forEach(({ child }, markerIndex) => {
    const matchIndex = findMarkerIndex(merged, markerIndex)
    if (matchIndex === -1) {
      unmatched.push(child)
      return
    }
    merged.splice(matchIndex, 1, child)
  })

  for (const child of unmatched) {
    const originalIndex = currentChildren.indexOf(child)
    const relativePosition = originalLength > 1 ? originalIndex / (originalLength - 1) : 0
    const targetIndex = Math.max(
      0,
      Math.min(merged.length, Math.round(relativePosition * merged.length)),
    )
    merged.splice(targetIndex, 0, child)
  }

  return merged
}

const RENDERABLE_HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

/**
 * Node types this editor instance can deserialize. Returns null if they cannot be read, in which
 * case the sanitizer keeps every typed node instead of dropping content it cannot verify.
 */
const registeredNodeTypes = (editorInstance: LexicalEditor): null | ReadonlySet<string> => {
  const nodes = editorInstance._nodes

  return nodes ? new Set(nodes.keys()) : null
}

/**
 * Streamed partial objects contain nodes whose properties have not fully arrived yet, and
 * Lexical hands some of those values straight to a DOM API: `HeadingNode.createDOM` passes the
 * deserialized `tag` into `document.createElement`, so a chunk carrying `tag: ""` throws
 * `InvalidCharacterError` in the middle of reconciliation. The nodes are then part of the
 * committed `EditorState` but have no entry in the editor's key-to-DOM map, and every later
 * `setEditorState` fails with `Reconciliation: could not find DOM element for node key` for the
 * remaining lifetime of that editor instance - including the final, complete apply.
 *
 * The `type` is checked against the editor's registered node types for the same reason one step
 * earlier: `parseEditorState` throws on a type it does not know. A streamed string value can
 * arrive as a prefix of itself - `"line"` for a `"linebreak"` node - so an unknown type is a
 * normal stage of the stream, not a broken document.
 *
 * Only renderability is checked here, not schema conformance - `h4`-`h6` are valid Lexical
 * headings even where the generation schema allows `h1`-`h3` only, and this helper also runs for
 * content restored from history.
 */
const isRenderableNode = (node: unknown, knownTypes?: null | ReadonlySet<string>): boolean => {
  if (!node || typeof node !== 'object') {
    return false
  }

  const { type, tag } = node as LexicalNodeJSON

  if (typeof type !== 'string' || type === '') {
    return false
  }

  if (knownTypes && !knownTypes.has(type)) {
    return false
  }

  if (type === 'text' && typeof (node as LexicalNodeJSON).text !== 'string') {
    return false
  }

  return type !== 'heading' || (typeof tag === 'string' && RENDERABLE_HEADING_TAGS.has(tag))
}

/**
 * Recursively drops nodes Lexical cannot render (see `isRenderableNode`). Without
 * `knownTypes` - the editor's registered node types - the type check is limited to the shape.
 *
 * Nodes are filtered individually instead of cutting off everything after the first unrenderable
 * one: for a streamed object both are equivalent, since the incomplete node is the last one - but
 * for content that is malformed in the middle, filtering loses that single node rather than the
 * whole remainder of the document.
 */
export const sanitizeLexicalChildren = (
  children: unknown,
  knownTypes?: null | ReadonlySet<string>,
): LexicalNodeJSON[] =>
  (Array.isArray(children) ? children : [])
    .filter((node): node is LexicalNodeJSON => isRenderableNode(node, knownTypes))
    .map((node) =>
      Array.isArray(node.children)
        ? { ...node, children: sanitizeLexicalChildren(node.children, knownTypes) }
        : node,
    )

const normalizeRoot = (root: Record<string, unknown>) => {
  if (!Array.isArray(root.children)) {
    return null
  }

  return {
    ...root,
    type: 'root',
    children: root.children,
    direction: root.direction ?? null,
    format: typeof root.format === 'string' ? root.format : '',
    indent: typeof root.indent === 'number' ? root.indent : 0,
    version: typeof root.version === 'number' ? root.version : 1,
  }
}

export const normalizeLexicalState = (state: unknown) => {
  const parsedState =
    typeof state === 'string'
      ? (() => {
          try {
            return JSON.parse(state)
          } catch {
            return null
          }
        })()
      : state

  if (!parsedState || typeof parsedState !== 'object' || !('root' in parsedState)) {
    return null
  }

  const root = (parsedState as { root?: unknown }).root

  if (!root || typeof root !== 'object') {
    return null
  }

  const normalizedRoot = normalizeRoot(root as Record<string, unknown>)

  if (!normalizedRoot) {
    return null
  }

  return {
    ...(parsedState as Record<string, unknown>),
    root: normalizedRoot,
  }
}

/**
 * Normalizes a state and drops everything the editor cannot render, in one step. Callers should
 * hand this exact result to the editor *and* to the form value - deriving one from the sanitized
 * and the other from the raw state lets the saved document contain nodes the editor never showed.
 *
 * Returns null when the value is not a usable Lexical state at all.
 */
export const sanitizeLexicalState = (state: unknown, editorInstance?: LexicalEditor | null) => {
  const normalizedState = normalizeLexicalState(state)

  if (!normalizedState) {
    return null
  }

  return {
    ...normalizedState,
    root: {
      ...normalizedState.root,
      children: sanitizeLexicalChildren(
        normalizedState.root.children,
        editorInstance ? registeredNodeTypes(editorInstance) : null,
      ),
    },
  }
}

export const setSafeLexicalState = (
  state: unknown,
  editorInstance?: LexicalEditor | null,
  options: SetSafeLexicalStateOptions = {},
) => {
  const { logErrors = true, onApplyError, originalRoot = null, skipScrollIntoView = false } = options

  if (!editorInstance) {
    if (logErrors) {
      console.error('Error setting editor state: missing Lexical editor instance', { state })
    }

    return false
  }

  const sanitizedState = sanitizeLexicalState(state, editorInstance)

  if (!sanitizedState) {
    if (logErrors) {
      console.error('Error setting editor state: invalid Lexical state shape', { state })
    }

    return false
  }

  let editorState

  // Parsing is separate from committing because it cannot damage the editor: it builds a detached
  // state, so a rejected node type leaves the current state and its DOM untouched and the caller
  // can simply try again with the next state.
  try {
    // Prefer the caller-provided pre-generation snapshot (see useGenerate.ts) over the live
    // editor state, which may already have been mutated by an earlier call in this same
    // streaming/generation cycle - see comment on `reinsertPreservedBlocks` for why that would
    // otherwise compound.
    const currentRoot = originalRoot ?? editorInstance.getEditorState().toJSON()?.root
    // Preserved blocks come from an already committed state and are merged in after sanitizing,
    // so they are never subject to it.
    sanitizedState.root.children = reinsertPreservedBlocks(currentRoot, sanitizedState.root.children)

    editorState = editorInstance.parseEditorState(sanitizedState as any)
  } catch (error) {
    if (logErrors) {
      console.error('Error parsing editor state: ', { error, state: sanitizedState })
    }

    return false
  }

  if (editorState.isEmpty()) {
    return false
  }

  try {
    editorInstance.setEditorState(
      editorState,
      skipScrollIntoView ? { tag: SKIP_SCROLL_INTO_VIEW_TAG } : undefined,
    )
    return true
  } catch (error) {
    if (logErrors) {
      console.error('Error setting editor state: ', { error, state: sanitizedState })
    }
    // Reconciliation throws mid-render, so the editor is now unable to render anything else.
    onApplyError?.(error)

    return false
  }
}
