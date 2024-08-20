import { useHistory } from './hooks/useHistory.js'
import React, { MouseEventHandler, useCallback } from 'react'

export const UndoRedoActions = ({ onChange }: { onChange: (val: unknown) => void }) => {
  const { canRedo, canUndo, redo, undo } = useHistory()

  const redoHistoryValue = useCallback<MouseEventHandler>(
    (event) => {
      event.stopPropagation()

      const value = redo()
      if (value) {
        onChange(value)
      }
    },
    [redo],
  )

  const undoHistoryValue = useCallback<MouseEventHandler>(
    (event) => {
      event.stopPropagation()

      const value = undo()
      if (value) {
        onChange(value)
      }
    },
    [undo],
  )

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
