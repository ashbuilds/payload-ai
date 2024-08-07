'use client'

import { useForm } from '@payloadcms/ui'
import { useCallback, useEffect, useState } from 'react'

import { PLUGIN_NAME } from '../../../defaults.js'

const STORAGE_KEY = `${PLUGIN_NAME}-fields-history`

interface HistoryState {
  [path: string]: {
    currentIndex: number
    history: any[]
  }
}

export const useHistory = (path: string, currentFieldValue = null) => {
  const getLatestHistory = useCallback((): HistoryState => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    } catch (e) {
      console.error('Error parsing history:', e)
      return {}
    }
  }, [])

  const saveToLocalStorage = useCallback((newGlobalHistory: HistoryState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGlobalHistory))
  }, [])

  // TODO: Reset undo/redo once user type anything on fields or change it manually
  useEffect(() => {
    if (currentFieldValue) {
      const latestHistory = getLatestHistory()
      const { currentIndex, history } = latestHistory[path] || { currentIndex: -1, history: [] }

      let newIndex = currentIndex
      if (currentIndex == -1) {
        newIndex = 0
      }

      history[0] = currentFieldValue
      const newGlobalHistory = {
        ...latestHistory,
        [path]: { currentIndex: newIndex, history },
      }

      saveToLocalStorage(newGlobalHistory)
    }
  }, [path])

  const set = useCallback(
    (data: any) => {
      const latestHistory = getLatestHistory()
      const { currentIndex, history } = latestHistory[path] || { currentIndex: -1, history: [] }
      const newHistory = [...history.slice(0, currentIndex + 1), data]
      const newGlobalHistory = {
        ...latestHistory,
        [path]: { currentIndex: newHistory.length - 1, history: newHistory },
      }
      saveToLocalStorage(newGlobalHistory)
      return data
    },
    [path, getLatestHistory, saveToLocalStorage],
  )

  const undo = useCallback(() => {
    const latestHistory = getLatestHistory()
    const { currentIndex, history } = latestHistory[path] || { currentIndex: -1, history: [] }
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      const newValue = history[newIndex]
      const newGlobalHistory = {
        ...latestHistory,
        [path]: { currentIndex: newIndex, history },
      }
      saveToLocalStorage(newGlobalHistory)
      return newValue
    }
    return undefined
  }, [path, getLatestHistory, saveToLocalStorage])

  const redo = useCallback(() => {
    const latestHistory = getLatestHistory()
    const { currentIndex, history } = latestHistory[path] || { currentIndex: -1, history: [] }
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1
      const newValue = history[newIndex]
      const newGlobalHistory = {
        ...latestHistory,
        [path]: { currentIndex: newIndex, history },
      }
      saveToLocalStorage(newGlobalHistory)
      return newValue
    }
    return undefined
  }, [path, getLatestHistory, saveToLocalStorage])

  const getLatestFieldHistory = useCallback(() => {
    const latestHistory = getLatestHistory()
    return latestHistory[path] || { currentIndex: -1, history: [] }
  }, [getLatestHistory, path])

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
