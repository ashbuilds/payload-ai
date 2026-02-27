import type { SerializedEditorState, SerializedLexicalNode } from 'lexical'

interface BeautifulMentionNode extends SerializedLexicalNode {
  data?: Record<string, unknown>
  trigger: string
  value: string
}

export const lexicalToPromptTemplate = (editorState: any | SerializedEditorState): string => {
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
          // The value from our endpoint is the full path e.g. "array.0.field"
          // and is consumed by the server-side template renderer.
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

  const rawTemplate = (editorState.root.children || []).map(traverse).join('').trim()
  
  // Post-process the template to fix nested template syntax
  // Example 1: `{{toHTML {{content}}}}` -> `{{toHTML content}}`
  // Example 2: `{{#each {{array}}}}` -> `{{#each array}}`
  // This is intentionally a narrow transform to normalize mention insertions.
  return rawTemplate.replace(/(\{\{[^{}]*)\{\{([^}]+)\}\}(.*?\}\})/g, '$1$2$3')
}
