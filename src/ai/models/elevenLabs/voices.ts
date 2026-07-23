export type Voice = {
  [key: string]: any
  name?: string
  voice_id: string
}

import { ElevenLabsClient } from 'elevenlabs'

import type { ResolvedProviderConfig } from '../../providers/resolveProviderConfig.js'

import { resolveProviderConfig } from '../../providers/resolveProviderConfig.js'

let voicesState: { voices: Voice[] } = { voices: [] }
export const getAllVoices = async (
  providerConfig: ResolvedProviderConfig['elevenLabs'] = resolveProviderConfig().elevenLabs,
): Promise<{ voices: Voice[] }> => {
  if (!providerConfig.apiKey) {
    return voicesState
  }

  try {
    const elevenLabs = new ElevenLabsClient({
      apiKey: providerConfig.apiKey,
    })
    if (!voicesState.voices.length) {
      voicesState = await elevenLabs.voices.getAll({
        timeoutInSeconds: 10000,
      })
    }
    return voicesState
  } catch (error) {
    console.error('getAllVoices: ', error)
    return voicesState
  }
}
