'use client'

import type { FieldClientComponent } from 'payload'

import { Button, toast, useField, useFormFields } from '@payloadcms/ui'
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

  // Get the parent path (the block path)
  const fieldPath = (path as string) || ''
  const blockPath = fieldPath.split('.').slice(0, -1).join('.')
  const voicesPath = `${blockPath}.voices`

  const { setValue } = useField<Voice[]>({ path: voicesPath })

  const fetchVoices = useCallback(async () => {
    setLoading(true)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

    try {
      // Call server endpoint - it will read the API key from the database
      const response = await fetch(`/api${PLUGIN_API_ENDPOINT_FETCH_VOICES}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorMessage = 'Failed to fetch voices'
        try {
          const error = await response.json()
          errorMessage = error.message || errorMessage
        } catch (e) {
          // If response is not JSON (e.g. 504 Gateway Timeout HTML), use status text
          errorMessage = `Error ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const voices: Voice[] = data.voices || []

      // Replace the entire array value at once
      // This is much more performant than dispatching ADD_ROW actions in a loop
      setValue(voices)

      toast.success(`Successfully fetched ${voices.length} voices!`)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch voices'
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Request timed out. Please try again.')
      } else {
        toast.error(`Error: ${msg}`)
      }
    } finally {
      setLoading(false)
      clearTimeout(timeoutId)
    }
  }, [setValue])

  return (
    <div style={{ marginBottom: '20px' }}>
      <Button buttonStyle="secondary" disabled={loading} margin={false} onClick={fetchVoices} size="medium">
        {loading ? 'Fetching Voices...' : 'Fetch Voices'}
      </Button>
      <p style={{ color: 'var(--theme-elevation-600)', fontSize: '13px', marginTop: '8px' }}>
        This will fetch all available voices from your ElevenLabs account. Make sure you have saved
        your API key in the Setup tab first.
      </p>
    </div>
  )
}
