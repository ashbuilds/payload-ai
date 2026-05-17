import type { LexicalEditor } from 'lexical'

export const setSafeLexicalState = (state: unknown, editorInstance: LexicalEditor) => {
  try {
    const editorState = editorInstance.parseEditorState(state as any)
    if (editorState.isEmpty()) {
      return
    }

    editorInstance.setEditorState(editorState)
  } catch (error) {
    console.error('Error setting editor state: ', { error, state })
  }
}
