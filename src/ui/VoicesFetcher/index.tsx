'use client'

import type { FieldClientComponent } from 'payload'

import { Button, useForm } from '@payloadcms/ui'
import React, { useCallback, useState } from 'react'

import { PLUGIN_API_ENDPOINT_FETCH_VOICES } from '../../defaults.js'

/**
 * VoicesFetcher Component
 * Fetches voices from ElevenLabs API (server-side) and populates the voices array field
 * SECURE: API key is never exposed to the client
 */
export const VoicesFetcher: FieldClientComponent = ({ path }) => {
  const [loading, setLoading] = useState(false)
  const { getFields, replaceState } = useForm()

  // Get the parent path (the block path)
  const fieldPath = (path as string) || ''
  const blockPath = fieldPath.split('.').slice(0, -1).join('.')
  const voicesPath = `${blockPath}.voices`

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
      const voices = data.voices || []

      // Get current form state and update the voices array
      // For array fields, we need to use replaceState to properly trigger UI re-render
      const currentFields = getFields()
      const newFields = { ...currentFields }

      // First, remove existing voice rows from the fields
      Object.keys(newFields).forEach((key) => {
        if (key.startsWith(`${voicesPath}.`)) {
          delete newFields[key]
        }
      })

      // Update the voices array field count
      newFields[voicesPath] = {
        ...newFields[voicesPath],
        rows: voices.map((voice: { id: string }, index: number) => ({
          id: voice.id || `voice-${index}`,
        })),
        value: voices.length,
      }

      // Add individual voice fields
      voices.forEach(
        (
          voice: {
            category?: string
            enabled?: boolean
            id: string
            labels?: Record<string, unknown>
            name: string
            preview_url?: string
          },
          index: number,
        ) => {
          const rowPath = `${voicesPath}.${index}`
          newFields[`${rowPath}.id`] = { initialValue: voice.id, value: voice.id }
          newFields[`${rowPath}.name`] = { initialValue: voice.name, value: voice.name }
          newFields[`${rowPath}.category`] = { initialValue: voice.category, value: voice.category }
          newFields[`${rowPath}.enabled`] = { initialValue: voice.enabled, value: voice.enabled }
          newFields[`${rowPath}.preview_url`] = {
            initialValue: voice.preview_url,
            value: voice.preview_url,
          }
          newFields[`${rowPath}.labels`] = { initialValue: voice.labels, value: voice.labels }
        },
      )

      // Replace the entire form state to trigger re-render of array fields
      replaceState(newFields)

      alert(`Successfully fetched ${voices.length} voices!`)
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to fetch voices'}`)
    } finally {
      setLoading(false)
    }
  }, [getFields, replaceState, voicesPath])

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
