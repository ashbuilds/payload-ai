import type { LexicalEditor, SerializedEditorState } from 'lexical'

/**
 * Validates and safely sets Lexical editor state.
 * This function implements comprehensive validation to prevent errors during
 * streaming when incomplete JSON states are passed to the editor.
 *
 * Validation steps:
 * 1. Basic null/undefined check
 * 2. Parse string states
 * 3. Must be an object
 * 4. Must have root property
 * 5. Root must not be empty
 * 6. Root must have valid type
 * 7. Must have children array
 * 8. Children array must not be empty
 * 9. All children must have valid types
 * 10. Recursively validate nested children
 */
export const setSafeLexicalState = (
  state: SerializedEditorState | string,
  editorInstance: LexicalEditor,
) => {
  try {
    // Step 1: Basic null/undefined check
    if (!state || !editorInstance) {
      return
    }

    // Step 2: Parse string states first
    let parsedState: SerializedEditorState
    if (typeof state === 'string') {
      try {
        parsedState = JSON.parse(state) as SerializedEditorState
      } catch {
        // Invalid JSON string, skip silently (likely streaming fragment)
        return
      }
    } else {
      parsedState = state
    }

    // Step 3: Must be an object
    if (typeof parsedState !== 'object' || parsedState === null) {
      return
    }

    // Step 4: Must have root property
    if (!parsedState.root || typeof parsedState.root !== 'object') {
      return
    }

    // Step 5: Root must not be empty (common streaming issue: { root: {} })
    if (Object.keys(parsedState.root).length === 0) {
      return
    }

    // Step 6: Root must have valid type
    if (!parsedState.root.type || parsedState.root.type !== 'root') {
      return
    }

    // Step 7: Must have children array
    if (!parsedState.root.children || !Array.isArray(parsedState.root.children)) {
      return
    }

    // Step 8: Children array must not be empty
    if (parsedState.root.children.length === 0) {
      return
    }

    // Step 9 & 10: Validate all children have valid types (deep validation)
    const hasInvalidChild = (children: any[]): boolean => {
      for (const child of children) {
        // Child must exist and be an object
        if (!child || typeof child !== 'object') {
          return true
        }

        // Child must have a valid type (not undefined, not empty string)
        if (
          !child.type ||
          child.type === 'undefined' ||
          child.type === '' ||
          typeof child.type !== 'string'
        ) {
          return true
        }

        // Recursively validate nested children
        if (child.children && Array.isArray(child.children) && child.children.length > 0) {
          if (hasInvalidChild(child.children)) {
            return true
          }
        }
      }
      return false
    }

    if (hasInvalidChild(parsedState.root.children)) {
      return
    }

    // All validation passed, parse and set the state
    const editorState = editorInstance.parseEditorState(parsedState)
    if (editorState.isEmpty()) {
      return
    }

    editorInstance.setEditorState(editorState)
  } catch (error) {
    // Suppress console errors for known streaming states to prevent spam
    // Only log if it's a completely unexpected error
    const isLikelyStreamingError =
      !state ||
      (typeof state === 'object' &&
        (!state.root || Object.keys(state.root as object).length === 0)) ||
      (error instanceof Error &&
        (error.message?.includes('undefined') || error.message?.includes('Reconciliation')))

    if (!isLikelyStreamingError) {
      console.error('[setSafeLexicalState] Unexpected error:', {
        error,
        statePreview:
          state && typeof state === 'object' ? JSON.stringify(state).substring(0, 200) : state,
      })
    }
    // Otherwise, silently ignore invalid streaming states
  }
}
