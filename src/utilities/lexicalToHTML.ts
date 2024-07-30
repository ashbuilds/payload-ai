import type { SerializedEditorState } from 'lexical'

import {
  type SanitizedServerEditorConfig,
  consolidateHTMLConverters,
  convertLexicalToHTML,
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
