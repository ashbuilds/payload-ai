import type { SpeechCreateParams } from 'openai/resources/audio/speech'

import OpenAI from 'openai'

import type { OpenAIResolvedProviderConfig } from './openai.js'

import { resolveProviderConfig } from '../../providers/resolveProviderConfig.js'

type OpenAITextToSpeechOptions = Exclude<SpeechCreateParams, 'input'>

export const generateVoice = async (
  text: string,
  options: {
    providerConfig?: OpenAIResolvedProviderConfig
  } & OpenAITextToSpeechOptions,
) => {
  const { providerConfig = resolveProviderConfig().openai } = options
  const openai = new OpenAI({
    apiKey: providerConfig.apiKey,
    baseURL: providerConfig.baseURL,
    defaultHeaders: providerConfig.headers,
    organization: providerConfig.organization,
    project: providerConfig.project,
  })
  const mp3 = await openai.audio.speech.create({
    input: text,
    model: options.model,
    response_format: options.response_format,
    speed: options.speed,
    voice: options.voice,
  })

  if (mp3.ok) {
    const audioBuffer = Buffer.from(await mp3.arrayBuffer())

    return {
      buffer: audioBuffer,
    }
  }
}
