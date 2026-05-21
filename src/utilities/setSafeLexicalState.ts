import type { LexicalEditor } from 'lexical'

type SetSafeLexicalStateOptions = {
  logErrors?: boolean
}

const normalizeRoot = (root: Record<string, unknown>) => {
  if (!Array.isArray(root.children)) {
    return null
  }

  return {
    ...root,
    children: root.children,
    direction: root.direction ?? null,
    format: typeof root.format === 'string' ? root.format : '',
    indent: typeof root.indent === 'number' ? root.indent : 0,
    type: 'root',
    version: typeof root.version === 'number' ? root.version : 1,
  }
}

export const normalizeLexicalState = (state: unknown) => {
  const parsedState =
    typeof state === 'string'
      ? (() => {
          try {
            return JSON.parse(state)
          } catch {
            return null
          }
        })()
      : state

  if (!parsedState || typeof parsedState !== 'object' || !('root' in parsedState)) {
    return null
  }

  const root = (parsedState as { root?: unknown }).root

  if (!root || typeof root !== 'object') {
    return null
  }

  const normalizedRoot = normalizeRoot(root as Record<string, unknown>)

  if (!normalizedRoot) {
    return null
  }

  return {
    ...(parsedState as Record<string, unknown>),
    root: normalizedRoot,
  }
}

export const setSafeLexicalState = (
  state: unknown,
  editorInstance?: LexicalEditor | null,
  options: SetSafeLexicalStateOptions = {},
) => {
  const { logErrors = true } = options

  if (!editorInstance) {
    if (logErrors) {
      console.error('Error setting editor state: missing Lexical editor instance', { state })
    }

    return false
  }

  const normalizedState = normalizeLexicalState(state)

  if (!normalizedState) {
    if (logErrors) {
      console.error('Error setting editor state: invalid Lexical state shape', { state })
    }

    return false
  }

  try {
    const editorState = editorInstance.parseEditorState(normalizedState as any)
    if (editorState.isEmpty()) {
      return false
    }

    editorInstance.setEditorState(editorState)
    return true
  } catch (error) {
    if (logErrors) {
      console.error('Error setting editor state: ', { error, state: normalizedState })
    }

    return false
  }
}
