export const setSafeLexicalState = (state, editorInstance, action = 'replace')=>{
    try {
        const editorState = editorInstance.parseEditorState(state);
        if (editorState.isEmpty()) {
            return;
        }
        editorInstance.setEditorState(editorState);
    } catch (error) {
        console.error('Error setting editor state: ', {
            error,
            state
        });
    }
};

//# sourceMappingURL=setSafeLexicalState.js.map