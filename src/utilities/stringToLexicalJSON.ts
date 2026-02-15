import type { SerializedEditorState, SerializedParagraphNode, SerializedTextNode } from 'lexical'

export const stringToLexicalJSON = (text: string): SerializedEditorState => {
  const rootChildren: SerializedParagraphNode[] = []

  const lines = text.split('\n')

  for (const line of lines) {
    const children: SerializedTextNode[] = []
    if (line.length > 0) {
      children.push({
        detail: 0,
        format: 0,
        mode: 'normal',
        style: '',
        text: line,
        type: 'text',
        version: 1,
      })
    }

    rootChildren.push({
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'paragraph',
      version: 1,
      textFormat: 0, 
    } as any)
  }

  return {
    root: {
      children: rootChildren,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}
