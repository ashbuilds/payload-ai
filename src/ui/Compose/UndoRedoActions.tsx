import type { MouseEventHandler } from 'react'

import React, { memo, useCallback, useEffect, useState } from 'react'

import { useHistory } from './hooks/useHistory.js'

export const UndoRedoActions = memo(({ onChange }: { onChange: (val: unknown) => void }) => {
  const { canRedo, canUndo, redo, undo } = useHistory()

  const redoHistoryValue = useCallback<MouseEventHandler>(
    (event) => {
      event.stopPropagation()

      const value = redo()
      if (value) {
        onChange(value)
      }
    },
    [redo, onChange],
  )

  const undoHistoryValue = useCallback<MouseEventHandler>(
    (event) => {
      event.stopPropagation()

      const value = undo()
      if (value) {
        onChange(value)
      }
    },
    [undo, onChange],
  )

  // Delay rendering until the client-side hydration is complete
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted || (!canUndo && !canRedo)) {
    return null
  }

  return (
    <React.Fragment>
      <button
        className={`btn btn--size-small btn--style-secondary ${!canUndo && 'btn--disabled'}`}
        disabled={!canUndo}
        onClick={undoHistoryValue}
        style={{ marginBlock: 0 }}
        type="button"
      >
        Undo
      </button>
      <button
        className={`btn btn--size-small btn--style-secondary ${!canRedo && 'btn--disabled'}`}
        disabled={!canRedo}
        onClick={redoHistoryValue}
        style={{ marginBlock: 0 }}
        type="button"
      >
        Redo
      </button>
    </React.Fragment>
  )
})

UndoRedoActions.displayName = 'UndoRedoActions'
