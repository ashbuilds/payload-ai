import { ElevenLabsClient } from 'elevenlabs'

import type { ResolvedProviderConfig } from '../../providers/resolveProviderConfig.js'

import { resolveProviderConfig } from '../../providers/resolveProviderConfig.js'

type ElevenLabsTextToSpeechOptions = {
  providerConfig?: ResolvedProviderConfig['elevenLabs']
  voice_id: string
}

export const generateVoice = async (text: string, options: ElevenLabsTextToSpeechOptions) => {
  const { providerConfig = resolveProviderConfig().elevenLabs } = options
  const elevenLabs = new ElevenLabsClient({
    apiKey: providerConfig.apiKey,
  })
  const response = (await elevenLabs.textToSpeech.convertWithTimstamps(options.voice_id, {
    ...options,
    text,
  })) as {
    alignment: string[]
    audio_base64: string
  }
  if (response?.audio_base64) {
    const audioBuffer = Buffer.from(response.audio_base64, 'base64')
    // const transcript = convertToTranscript(mp3Audio.alignment)

    return {
      alignment: response.alignment,
      buffer: audioBuffer,
    }
  }
}
