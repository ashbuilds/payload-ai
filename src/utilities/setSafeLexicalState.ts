import type { LexicalEditor } from 'lexical'

type EditorAction = 'replace' | 'update'

export const setSafeLexicalState = (
  state,
  editorInstance: LexicalEditor,
  action: EditorAction = 'replace',
) => {
  try {
    const editorState = editorInstance.parseEditorState(state)
    if (editorState.isEmpty()) {
      return
    }

    editorInstance.setEditorState(editorState)
  } catch (e) {
    console.error('Error setting editor state: ', e)
  }
}
