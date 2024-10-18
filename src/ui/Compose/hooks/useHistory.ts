'use client'

import { useDocumentInfo, useField, useFieldProps } from '@payloadcms/ui'
import { useCallback, useEffect } from 'react'

import { PLUGIN_NAME } from '../../../defaults.js'

const STORAGE_KEY = `${PLUGIN_NAME}-fields-history`

interface HistoryState {
  [path: string]: {
    currentIndex: number
    history: any[]
  }
}

export const useHistory = () => {
  const { id } = useDocumentInfo()
  const { path: pathFromContext, schemaPath } = useFieldProps()
  const { value: currentFieldValue } = useField<string>({
    path: pathFromContext,
  })

  const fieldKey = `${id}.${schemaPath}`

  const getLatestHistory = useCallback((): HistoryState => {
    try {
      // This condition is applied, as it was somehow triggering on server side
      if (typeof localStorage !== 'undefined') {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      }
      return {}
    } catch (e) {
      console.error('Error parsing history:', e)
      return {}
    }
  }, [])

  const saveToLocalStorage = useCallback((newGlobalHistory: HistoryState) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newGlobalHistory))
    }
  }, [])

  // Clear previous history
  const clearHistory = useCallback(() => {
    const latestHistory = { ...getLatestHistory() }
    Object.keys(latestHistory).forEach((k) => {
      if (!k.startsWith(id?.toString())) {
        delete latestHistory[k]
      }
    })
    saveToLocalStorage(latestHistory)
  }, [id, fieldKey, getLatestHistory, saveToLocalStorage])

  useEffect(() => {
    // This is applied to clear out the document history which is not currently in use
    clearHistory()

    const latestHistory = getLatestHistory()
    const { currentIndex, history } = latestHistory[fieldKey] || {
      currentIndex: -1,
      history: [],
    }

    let newIndex = currentIndex
    if (currentIndex == -1) {
      newIndex = 0
      if (currentFieldValue) {
        history[newIndex] = currentFieldValue
      }
    }

    const newGlobalHistory = {
      ...latestHistory,
      [fieldKey]: { currentIndex: newIndex, history },
    }

    saveToLocalStorage(newGlobalHistory)
  }, [fieldKey])

  const set = useCallback(
    (data: any) => {
      const latestHistory = getLatestHistory()
      const { currentIndex, history } = latestHistory[fieldKey] || {
        currentIndex: -1,
        history: [],
      }
      const newHistory = [...history.slice(0, currentIndex + 1), data]
      const newGlobalHistory = {
        ...latestHistory,
        [fieldKey]: { currentIndex: newHistory.length - 1, history: newHistory },
      }
      saveToLocalStorage(newGlobalHistory)
      return data
    },
    [fieldKey, getLatestHistory, saveToLocalStorage],
  )

  const undo = useCallback(() => {
    const latestHistory = getLatestHistory()
    const { currentIndex, history } = latestHistory[fieldKey] || { currentIndex: -1, history: [] }
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      const newValue = history[newIndex]
      const newGlobalHistory = {
        ...latestHistory,
        [fieldKey]: { currentIndex: newIndex, history },
      }
      saveToLocalStorage(newGlobalHistory)
      return newValue
    }
    return undefined
  }, [fieldKey, getLatestHistory, saveToLocalStorage])

  const redo = useCallback(() => {
    const latestHistory = getLatestHistory()
    const { currentIndex, history } = latestHistory[fieldKey] || { currentIndex: -1, history: [] }
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1
      const newValue = history[newIndex]
      const newGlobalHistory = {
        ...latestHistory,
        [fieldKey]: { currentIndex: newIndex, history },
      }
      saveToLocalStorage(newGlobalHistory)
      return newValue
    }
    return undefined
  }, [fieldKey, getLatestHistory, saveToLocalStorage])

  const getLatestFieldHistory = useCallback(() => {
    const latestHistory = getLatestHistory()
    return latestHistory[fieldKey] || { currentIndex: -1, history: [] }
  }, [getLatestHistory, fieldKey])

  const fieldHistory = getLatestFieldHistory()

  const canUndo = fieldHistory.currentIndex > 0
  const canRedo = fieldHistory.currentIndex < fieldHistory.history.length - 1
  const currentValue = fieldHistory.history[fieldHistory.currentIndex]

  return {
    canRedo,
    canUndo,
    currentValue,
    redo,
    set,
    undo,
  }
}
