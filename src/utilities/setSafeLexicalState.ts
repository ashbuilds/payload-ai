import type { LexicalEditor } from 'lexical'

const sanitizeLexicalState = (state: any): any => {
  // 1. Ensure root exists and is valid
  if (!state || typeof state !== 'object') {
    return null
  }

  // If no root, or root is not an object, it's invalid
  if (!state.root || typeof state.root !== 'object') {
    return null
  }

  // 2. Clone to avoid mutation
  const cleanState = JSON.parse(JSON.stringify(state))

  // 3. Ensure root has required props
  cleanState.root.type = 'root'
  cleanState.root.format = cleanState.root.format || 'left'
  cleanState.root.indent = cleanState.root.indent || 0
  cleanState.root.version = cleanState.root.version || 1

  // 4. Recursive sanitizer for children
  const sanitizeNode = (node: any): any => {
    if (!node || typeof node !== 'object') {
      return null
    }

    // Must have a type. If streaming incomplete node (type is missing/empty), discard it.
    if (!node.type || typeof node.type !== 'string') {
      return null
    }

    // Default version if missing
    node.version = node.version || 1

    // If node has children, sanitize them
    if (Array.isArray(node.children)) {
      node.children = node.children
        .map(sanitizeNode)
        .filter((child: any) => child !== null)
    } else {
      // Ensure children is at least an empty array if it's supposed to be there? 
      // Actually lots of leaf nodes don't have children. 
      // But Root, Paragraph, etc do. 
      // Let's safe-guard standard ElementNodes:
      if (['heading', 'link', 'list', 'listitem', 'paragraph', 'quote', 'root'].includes(node.type)) {
        node.children = node.children || []
      }
    }

    // Specific node fixes
    if (node.type === 'text') {
      // Text nodes must have text prop
      if (typeof node.text !== 'string') {
        // If text is missing, it might be incomplete. 
        // We can either discard or default to empty string.
        // For streaming, empty string is safer than discarding early if we want to show cursor?
        node.text = node.text || ''
      }
      node.mode = node.mode ?? 0
      node.style = node.style || ''
      node.detail = node.detail ?? 0
    }

    return node
  }

  // 5. Sanitize root's children
  if (Array.isArray(cleanState.root.children)) {
    cleanState.root.children = cleanState.root.children
      .map(sanitizeNode)
      .filter((child: any) => child !== null)
  } else {
    cleanState.root.children = []
  }

  return cleanState
}

export const setSafeLexicalState = (state: unknown, editorInstance: LexicalEditor) => {
  try {
    const validState = sanitizeLexicalState(state)
    
    if (!validState) {
      return
    }

    const editorState = editorInstance.parseEditorState(validState)
    if (editorState.isEmpty()) {
      return
    }

    editorInstance.setEditorState(editorState)
  } catch (_error) {
    // Silently catch errors during streaming to avoid console noise.
    // Lexical's parseEditorState is very strict and will throw if the
    // object structure is even slightly incomplete during the stream.
  }
}

