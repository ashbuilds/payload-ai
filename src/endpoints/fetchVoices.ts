import type { Endpoint, PayloadRequest } from 'payload'

import { PLUGIN_API_ENDPOINT_FETCH_VOICES } from '../defaults.js'

interface ElevenLabsVoice {
  category?: string
  labels?: Record<string, string>
  name: string
  preview_url?: string
  voice_id: string
}

export const fetchVoices: Endpoint = {
  handler: async (req: PayloadRequest) => {
    try {
      // Check authentication
      if (!req.user) {
        return Response.json({ message: 'Authentication required' }, { status: 401 })
      }

      // Fetch AI Settings global to get the encrypted API key
      const aiSettings = await req.payload.findGlobal({
        slug: 'ai-settings',
        context: { unsafe: true },
      })

      // Find the ElevenLabs provider block
      const elevenlabsProvider = aiSettings?.providers?.find(
        (provider: any) => provider.blockType === 'elevenlabs' && provider.enabled,
      )

      if (!elevenlabsProvider) {
        return Response.json(
          { message: 'ElevenLabs provider not found or not enabled in AI Settings' },
          { status: 400 },
        )
      }

      // Get the API key (already decrypted by afterRead hook due to unsafe context)
      const apiKey = elevenlabsProvider.apiKey

      if (!apiKey) {
        return Response.json(
          {
            message: 'API key not found. Please configure your ElevenLabs API key in AI Settings.',
          },
          { status: 400 },
        )
      }

      // Call ElevenLabs API to fetch voices
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        return Response.json(
          { message: `ElevenLabs API error: ${errorText}` },
          { status: response.status },
        )
      }

      const data = await response.json()

      // Transform voices to match our schema
      const voices = (data.voices || []).map((voice: ElevenLabsVoice) => ({
        id: voice.voice_id,
        name: voice.name,
        category: voice.category || 'premade',
        enabled: true,
        labels: voice.labels || {},
        preview_url: voice.preview_url || '',
      }))

      return Response.json({
        success: true,
        voices,
      })
    } catch (error) {
      req.payload.logger.error(error, 'Error fetching ElevenLabs voices')
      return Response.json(
        { message: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 },
      )
    }
  },
  method: 'post',
  path: PLUGIN_API_ENDPOINT_FETCH_VOICES,
}
