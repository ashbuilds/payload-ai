import type { ImageGenerateParams } from 'openai/resources/images'
import type { PayloadHandler, PayloadRequest } from 'payload'

import { GenerationModels } from './models/index.js'

interface ToTextPayload {
  options: { locale: string; modelId: string }
  text: string
}
interface ToImagePayload {
  options: {
    enablePromptOptimization?: boolean
    modelId?: string
    size?: ImageGenerateParams['size']
  }
  text: string
}

interface GenerateType {
  toImage: (args: ToImagePayload) => Promise<{
    result: { alt: string; buffer: Buffer }
  }>
  toSpeech: PayloadHandler
  toText: (args: ToTextPayload) => Promise<{ result: string }>
  toVideo: PayloadHandler
}

export const Generate = {
  toImage: async ({ options, text }: ToImagePayload) => {
    const model = GenerationModels.find((m) => m.id === options.modelId)

    if (!model) {
      throw new Error('Model not found')
    }

    try {
      const model = GenerationModels.find((m) => m.id === options.modelId)
      const result = await model.handler?.(text, options)

      return { result }
    } catch (e) {
      console.error('Error generating text:', e)
      return { result: { alt: '', buffer: null } }
    }
  },
  toSpeech: async (req: PayloadRequest) => {
    console.log('/ai-generate/textarea: PayloadRequest', req)

    return new Response('chat-complete')
  },
  toText: async ({ options, text }: ToTextPayload) => {
    const model = GenerationModels.find((m) => m.id === options.modelId)

    if (!model) {
      throw new Error('Model not found')
    }

    try {
      const result = await model.handler?.(text, options)

      return { result }
    } catch (e) {
      console.error('Error generating text:', e)
      return { result: '' }
    }
  },
  toVideo: async (req: PayloadRequest) => {
    console.log('/ai-generate/video: PayloadRequest', req)

    return new Response('chat-complete')
  },
}
