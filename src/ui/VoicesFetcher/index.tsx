'use client'

import type { FieldClientComponent } from 'payload'

import { Button, useForm, useFormFields } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

import { PLUGIN_API_ENDPOINT_FETCH_VOICES } from '../../defaults.js'

interface Voice {
  category?: string
  enabled?: boolean
  id: string
  labels?: Record<string, unknown>
  name: string
  preview_url?: string
}

/**
 * VoicesFetcher Component
 * Fetches voices from ElevenLabs API (server-side) and populates the voices array field
 * SECURE: API key is never exposed to the client
 */
export const VoicesFetcher: FieldClientComponent = ({ path }) => {
  const [loading, setLoading] = useState(false)
  const { dispatchFields } = useForm()

  // Get the parent path (the block path)
  const fieldPath = (path as string) || ''
  const blockPath = fieldPath.split('.').slice(0, -1).join('.')
  const voicesPath = `${blockPath}.voices`

  // Get the current voices array to know how many rows to remove
  const voicesField = useFormFields(([fields]) => fields[voicesPath])
  const currentRowCount =
    voicesField && 'rows' in voicesField && Array.isArray(voicesField.rows)
      ? voicesField.rows.length
      : 0

  const fetchVoices = useCallback(async () => {
    setLoading(true)

    try {
      // Call server endpoint - it will read the API key from the database
      const response = await fetch(`/api${PLUGIN_API_ENDPOINT_FETCH_VOICES}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to fetch voices')
      }

      const data = await response.json()
      const voices: Voice[] = data.voices || []

      // Remove existing rows first (in reverse order to maintain indices)
      for (let i = currentRowCount - 1; i >= 0; i--) {
        dispatchFields({
          type: 'REMOVE_ROW',
          path: voicesPath,
          rowIndex: i,
        })
      }

      // Add new rows for each voice using ADD_ROW action
      for (const voice of voices) {
        dispatchFields({
          type: 'ADD_ROW',
          path: voicesPath,
          subFieldState: {
            id: { initialValue: voice.id, valid: true, value: voice.id },
            name: { initialValue: voice.name, valid: true, value: voice.name },
            category: { initialValue: voice.category || 'premade', valid: true, value: voice.category || 'premade' },
            enabled: { initialValue: voice.enabled !== false, valid: true, value: voice.enabled !== false },
            labels: { initialValue: voice.labels || {}, valid: true, value: voice.labels || {} },
            preview_url: { initialValue: voice.preview_url || '', valid: true, value: voice.preview_url || '' },
          },
        })
      }

      alert(`Successfully fetched ${voices.length} voices!`)
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to fetch voices'}`)
    } finally {
      setLoading(false)
    }
  }, [currentRowCount, dispatchFields, voicesPath])

  return (
    <div style={{ marginBottom: '20px' }}>
      <Button buttonStyle="secondary" disabled={loading} onClick={fetchVoices} size="medium">
        {loading ? 'Fetching Voices...' : 'Fetch Voices from ElevenLabs'}
      </Button>
      <p style={{ color: 'var(--theme-elevation-600)', fontSize: '13px', marginTop: '8px' }}>
        This will fetch all available voices from your ElevenLabs account. Make sure you have saved
        your API key in the Setup tab first.
      </p>
    </div>
  )
}



