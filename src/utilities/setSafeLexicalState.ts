import type { LexicalEditor } from 'lexical'

type EditorAction = 'replace' | 'update'

export const setSafeLexicalState = (
  state: unknown,
  editorInstance: LexicalEditor,
  action: EditorAction = 'replace',
) => {
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
