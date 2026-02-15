import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

interface BeautifulMentionNode extends SerializedLexicalNode {
  trigger: string
  value: string
  data?: Record<string, unknown>
}

export const lexicalToPromptTemplate = (editorState: SerializedEditorState | any): string => {
  if (!editorState || !editorState.root) {
    return ''
  }

  const traverse = (node: SerializedLexicalNode): string => {
    if (node.type === 'text') {
      return (node as any).text || ''
    }

    if (node.type === 'beautifulMention') {
      const mentionNode = node as BeautifulMentionNode
      // Handle # (Field) -> {{value}}
      if (mentionNode.trigger === '#') {
          // If the value contains spaces or special chars, it might need brackets,
          // but usually for Handlebars variable replacement we expect {{field_name}}
          // The value from our endpoint is the full path e.g. "array.0.field"
          // We assume the value is ready for handlebars.
          return `{{${mentionNode.value}}}`
      }
      // Handle @ (Image) -> @value
      if (mentionNode.trigger === '@') {
          return `@${mentionNode.value}`
      }
      return mentionNode.value
    }

    if (node.type === 'paragraph') {
      const childrenContent = (node as any).children?.map(traverse).join('') || ''
      return childrenContent + '\n'
    }

    if ((node as any).children) {
      return (node as any).children.map(traverse).join('')
    }

    return ''
  }

  return (editorState.root.children || []).map(traverse).join('').trim()
}
