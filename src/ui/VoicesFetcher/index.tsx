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
  const { dispatchFields } = useForm()

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

      // Update the voices field with fetched voices
      dispatchFields({
        type: 'UPDATE',
        path: voicesPath,
        value: data.voices || [],
      })

      alert(`Successfully fetched ${data.voices?.length || 0} voices!`)
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to fetch voices'}`)
    } finally {
      setLoading(false)
    }
  }, [dispatchFields, voicesPath])

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
