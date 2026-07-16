import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

import {
  consolidateHTMLConverters,
  convertLexicalToHTML,
  type SanitizedServerEditorConfig,
} from '@payloadcms/richtext-lexical'

// Marker prefix/suffix for the block-placeholder scheme - see setSafeLexicalState.ts for the
// counterpart that swaps markers back for the real block after generation. Exported so both
// sides share one definition.
export const BLOCK_PLACEHOLDER_PREFIX = '[[[BLOCK_'
export const BLOCK_PLACEHOLDER_SUFFIX = ']]]'

/**
 * Non-Compose text actions (Translate/Simplify/Proofread/...) only ever give the model this
 * rendered HTML as its view of the current content (via the `{{toHTML field}}` prompt
 * placeholder) - the model never sees the underlying Lexical JSON. Custom `block` nodes
 * (BlocksFeature) have no registered HTML converter, so richtext-lexical's HTML conversion
 * silently produces nothing for them: the model isn't just unable to reproduce a block, it has
 * no way of knowing one exists there at all, so it's removed the moment any such action runs.
 *
 * Substituting a plain-text marker in a block's place gives the model something it CAN
 * legally see and echo back (paired with an instruction to preserve it verbatim, see
 * `endpoints/index.ts`), which `setSafeLexicalState.ts` then uses to reinsert the real block
 * afterwards. Only top-level `root.children` blocks are covered; blocks nested inside other
 * node types are out of scope for this pass.
 */
export const withBlockPlaceholders = (
  editorData: SerializedEditorState,
): SerializedEditorState => {
  const root = editorData?.root
  if (!root || !Array.isArray(root.children)) {
    return editorData
  }

  let blockIndex = 0
  const children = root.children.map((child: SerializedLexicalNode) => {
    if (!child || child.type !== 'block') {
      return child
    }

    const marker = `${BLOCK_PLACEHOLDER_PREFIX}${blockIndex}${BLOCK_PLACEHOLDER_SUFFIX}`
    blockIndex += 1

    return {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 0,
          style: '',
          text: marker,
          version: 1,
        },
      ],
      direction: null,
      format: '',
      indent: 0,
      textFormat: 0,
      textStyle: '',
      version: 1,
    } as unknown as SerializedLexicalNode
  })

  return {
    ...editorData,
    root: {
      ...root,
      children,
    },
  } as SerializedEditorState
}

export async function lexicalToHTML(
  editorData: SerializedEditorState,
  editorConfig: SanitizedServerEditorConfig,
) {
  return await convertLexicalToHTML({
    converters: consolidateHTMLConverters({ editorConfig }),
    data: withBlockPlaceholders(editorData),
  })
}
