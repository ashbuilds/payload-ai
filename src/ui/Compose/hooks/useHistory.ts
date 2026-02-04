'use client'

import { useDocumentInfo, useForm } from '@payloadcms/ui'
import { useCallback, useEffect, useRef } from 'react'
import { getSiblingData } from 'payload/shared'

import { PLUGIN_NAME } from '../../../defaults.js'
import { useFieldProps } from '../../../providers/FieldProvider/useFieldProps.js'

const STORAGE_KEY = `${PLUGIN_NAME}-fields-history`
const MAX_HISTORY_SIZE = 50

interface HistoryState {
  [path: string]: {
    currentIndex: number
    history: any[]
  }
}

// Global cache to prevent synchronous localStorage reads on every render
let globalHistoryCache: HistoryState | null = null

export const useHistory = () => {
  const { id } = useDocumentInfo()
  const { path, schemaPath } = useFieldProps()
  const { getData } = useForm()

  const fieldKey = `${id}.${schemaPath}`

  const getLatestHistory = useCallback((): HistoryState => {
    // Return cache if available
    if (globalHistoryCache) {
      return globalHistoryCache
    }

    try {
      if (typeof localStorage !== 'undefined') {
        // Read once, cache it
        const stored = localStorage.getItem(STORAGE_KEY)
        globalHistoryCache = stored ? JSON.parse(stored) : {}
        return globalHistoryCache!
      }
      return {}
    } catch (e) {
      console.error('Error parsing history:', e)
      return {}
    }
  }, [])

  // Debounce timer ref to prevent excessive localStorage writes
  const saveTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  const saveToLocalStorage = useCallback((newGlobalHistory: HistoryState) => {
    // Update cache immediately
    globalHistoryCache = newGlobalHistory

    if (typeof localStorage === 'undefined') {
      return
    }

    // Clear any pending save
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Debounce the save operation by 500ms
    saveTimerRef.current = setTimeout(() => {
      // Use requestIdleCallback if available to avoid blocking the main thread
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(
          () => {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(newGlobalHistory))
            } catch (e) {
              console.warn('Failed to save history to localStorage', e)
            }
          },
          { timeout: 2000 },
        )
      } else {
        // Fallback for browsers without requestIdleCallback
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newGlobalHistory))
        } catch (e) {
          console.warn('Failed to save history to localStorage', e)
        }
      }
      saveTimerRef.current = null
    }, 500)
  }, [])

  // Sync with other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          globalHistoryCache = JSON.parse(e.newValue)
        } catch (err) {
          // ignore parse error
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Clear previous history
  const clearHistory = useCallback(() => {
    const latestHistory = { ...getLatestHistory() }
    let hasChanges = false
    Object.keys(latestHistory).forEach((k) => {
      if (!k.startsWith(id?.toString() ?? '')) {
        delete latestHistory[k]
        hasChanges = true
      }
    })
    
    if (hasChanges) {
      saveToLocalStorage(latestHistory)
    }
  }, [id, getLatestHistory, saveToLocalStorage])

  useEffect(() => {
    // This is applied to clear out the document history which is not currently in use
    clearHistory()

    const latestHistory = getLatestHistory()
    const { currentIndex, history } = latestHistory[fieldKey] || {
      currentIndex: -1,
      history: [],
    }

    let newIndex = currentIndex
    let historyUpdated = false
    const newHistoryArray = [...history]

    if (currentIndex == -1) {
      newIndex = 0
      
      // Get initial value from form data instead of subscribing to useField
      // This implementation avoids re-rendering on every keystroke
      try {
        const data = getData()
        // We need to resolve the value from the data object using the path
        // path might be 'group.subgroup.field'
        if (path) {
          const value = getSiblingData(data, path)
          if (value) {
            newHistoryArray[newIndex] = value
            historyUpdated = true
          }
        }
      } catch (e) {
        // If we can't get the data, just ignore
      }
    }

    if (historyUpdated) {
      const newGlobalHistory = {
        ...latestHistory,
        [fieldKey]: { currentIndex: newIndex, history: newHistoryArray },
      }
      saveToLocalStorage(newGlobalHistory)
    }
  }, [fieldKey, getData, path, clearHistory, getLatestHistory, saveToLocalStorage])

  const set = useCallback(
    (data: any) => {
      const latestHistory = getLatestHistory()
      const { currentIndex, history } = latestHistory[fieldKey] || {
        currentIndex: -1,
        history: [],
      }
      
      // Create new history array slice, appending new data
      let newHistory = [...history.slice(0, currentIndex + 1), data]
      
      // Enforce Max History Size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory = newHistory.slice(newHistory.length - MAX_HISTORY_SIZE)
      }
      
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
  
  // Note: We deliberately do not return currentValue to avoid subscription re-renders
  // The consumers of this hook (UndoRedoActions) didn't use it anyway.

  return {
    canRedo,
    canUndo,
    redo,
    set,
    undo,
  }
}
