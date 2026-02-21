import type { SerializedEditorState } from 'lexical'

import {
  consolidateHTMLConverters,
  convertLexicalToHTML,
  type SanitizedServerEditorConfig,
} from '@payloadcms/richtext-lexical'

export async function lexicalToHTML(
  editorData: SerializedEditorState,
  editorConfig: SanitizedServerEditorConfig,
) {
  return await convertLexicalToHTML({
    converters: consolidateHTMLConverters({ editorConfig }),
    data: editorData,
  })
}
