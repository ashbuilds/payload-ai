'use client'

import { useDocumentInfo, useField, useFieldProps, useForm } from '@payloadcms/ui'
import { useCallback, useEffect, useState } from 'react'

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
      const { currentIndex, history } = latestHistory[fieldKey] || {
        currentIndex: -1,
        history: [],
      }

      let newIndex = currentIndex
      if (currentIndex == -1) {
        newIndex = 0
      }

      history[newIndex] = currentFieldValue
      const newGlobalHistory = {
        ...latestHistory,
        [fieldKey]: { currentIndex: newIndex, history },
      }

      saveToLocalStorage(newGlobalHistory)
    }
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
