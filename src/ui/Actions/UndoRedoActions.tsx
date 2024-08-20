import { useHistory } from './hooks/useHistory.js'
import React, { useCallback } from 'react'

export const UndoRedoActions = ({ onChange }: { onChange: (val: unknown) => void }) => {
  const { canRedo, canUndo, redo, undo } = useHistory()

  const redoHistoryValue = useCallback(() => {
    const val = redo()
    if (val) {
      onChange(val)
    }
  }, [redo])

  const undoHistoryValue = useCallback(() => {
    const val = undo()
    if (val) {
      onChange(val)
    }
  }, [undo])

  if (!canUndo && !canRedo) return null

  return (
    <>
      <button onClick={undoHistoryValue} type="button" disabled={!canUndo}>
        Undo
      </button>
      <button onClick={redoHistoryValue} type="button" disabled={!canRedo}>
        Redo
      </button>
    </>
  )
}
