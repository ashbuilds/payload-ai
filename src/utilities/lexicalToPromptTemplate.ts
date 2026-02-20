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

  const rawTemplate = (editorState.root.children || []).map(traverse).join('').trim()
  
  // Post-process the template to fix nested handlebars syntax
  // Example 1: `{{toHTML {{content}}}}` -> `{{toHTML content}}`
  // Example 2: `{{#each {{array}}}}` -> `{{#each array}}`
  // Matches any handlebar opening `{{` or `{{#` or `{{/` followed by anything, followed by `{{value}}`, followed by `}}`
  // Actually, a simpler regex: replace `{{(` with `{{` is wrong.
  // We want to replace `{{... {{value}} ...}}` with `{{... value ...}}`
  // Regex to find `{{` inside another `{{` `}}` block is tricky.
  // Instead, let's just globally replace `{{` and `}}` that are immediately inside another tag.
  // Let's use a simpler heuristic: if a mention trigger `#` was used, it returned `{{value}}`.
  // If the user typed `{{toHTML `, then inserted `#content`, then typed `}}`, the raw string is `{{toHTML {{content}}}}`.
  // We can just replace `{{` and `}}` if they are surrounded by an outer bracket context.
  // For safety, let's just fix the specific pattern of nested brackets for mentions.
  return rawTemplate.replace(/({{[^{}]*?){{([^}]+)}}(.*?}})/g, '$1$2$3')
}
