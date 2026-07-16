import type { LexicalEditor } from 'lexical'

import { BLOCK_PLACEHOLDER_PREFIX, BLOCK_PLACEHOLDER_SUFFIX } from './lexicalToHTML.js'

type SetSafeLexicalStateOptions = {
  logErrors?: boolean
  /**
   * Pre-generation snapshot of `root` (as returned by `editorState.toJSON().root`), used to
   * find and reinsert preserved custom blocks. Passing this explicitly (rather than reading the
   * live editor state at call time) matters for streaming generations, which call
   * `setSafeLexicalState` repeatedly as partial content arrives - see `useGenerate.ts` for why
   * that would otherwise compound block position errors on every call.
   */
  originalRoot?: null | Record<string, unknown>
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

export const setSafeLexicalState = (
  state: unknown,
  editorInstance?: LexicalEditor | null,
  options: SetSafeLexicalStateOptions = {},
) => {
  const { logErrors = true, originalRoot = null } = options

  if (!editorInstance) {
    if (logErrors) {
      console.error('Error setting editor state: missing Lexical editor instance', { state })
    }

    return false
  }

  const normalizedState = normalizeLexicalState(state)

  if (!normalizedState) {
    if (logErrors) {
      console.error('Error setting editor state: invalid Lexical state shape', { state })
    }

    return false
  }

  try {
    // Prefer the caller-provided pre-generation snapshot (see useGenerate.ts) over the live
    // editor state, which may already have been mutated by an earlier call in this same
    // streaming/generation cycle - see comment on `reinsertPreservedBlocks` for why that would
    // otherwise compound.
    const currentRoot = originalRoot ?? editorInstance.getEditorState().toJSON()?.root
    normalizedState.root.children = reinsertPreservedBlocks(
      currentRoot,
      normalizedState.root.children as LexicalNodeJSON[],
    )

    const editorState = editorInstance.parseEditorState(normalizedState as any)
    if (editorState.isEmpty()) {
      return false
    }

    editorInstance.setEditorState(editorState)
    return true
  } catch (error) {
    if (logErrors) {
      console.error('Error setting editor state: ', { error, state: normalizedState })
    }

    return false
  }
}
