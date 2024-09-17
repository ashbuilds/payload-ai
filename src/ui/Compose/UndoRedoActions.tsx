import { useHistory } from './hooks/useHistory.js'
import React, { MouseEventHandler, useCallback, useEffect, useState } from 'react'

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

  // Delay rendering until the client-side hydration is complete
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted || (!canUndo && !canRedo)) return null

  return (
    <>
      <button
        onClick={undoHistoryValue}
        type="button"
        disabled={!canUndo}
        className={`btn btn--size-small btn--style-secondary ${!canUndo && 'btn--disabled'}`}
        style={{ marginBlock: 0 }}
      >
        Undo
      </button>
      <button
        onClick={redoHistoryValue}
        type="button"
        disabled={!canRedo}
        className={`btn btn--size-small btn--style-secondary ${!canRedo && 'btn--disabled'}`}
        style={{ marginBlock: 0 }}
      >
        Redo
      </button>
    </>
  )
}
