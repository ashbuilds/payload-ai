import type { LexicalEditor, SerializedEditorState } from 'lexical'

type EditorAction = 'replace' | 'update'

export const setSafeLexicalState = (
  state:  SerializedEditorState | string,
  editorInstance: LexicalEditor,
  // action: EditorAction = 'replace',
) => {
  try {
    console.log('state:, ', state)
    const editorState = editorInstance.parseEditorState(state)
    if (editorState.isEmpty()) {
      return
    }

    editorInstance.setEditorState(editorState)
  } catch (error) {
    console.error('Error setting editor state: ', { error, state })
  }
}
