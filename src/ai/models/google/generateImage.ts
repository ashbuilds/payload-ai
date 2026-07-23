import { GoogleGenAI } from '@google/genai'

import type { GenerateImageParams } from '../../../types.js'
import type { ResolvedProviderConfig } from '../../providers/resolveProviderConfig.js'

import { resolveProviderConfig } from '../../providers/resolveProviderConfig.js'

export const generateImage = async (
  prompt: string,
  {
    aspectRatio = '1:1',
    model = 'imagen-4.0-fast-generate-001',
    outputMimeType = 'image/png',
    providerConfig = resolveProviderConfig().google,
  }: {
    aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'
    model?: string
    outputMimeType?: 'image/jpeg' | 'image/png'
    providerConfig?: ResolvedProviderConfig['google']
  } & GenerateImageParams = {},
) => {
  const ai = new GoogleGenAI({
    apiKey: providerConfig.apiKey,
    httpOptions: {
      baseUrl: providerConfig.baseURL,
      headers: providerConfig.headers,
    },
  })

  const response = await ai.models.generateImages({
    config: {
      aspectRatio,
      numberOfImages: 1,
      outputMimeType,
    },
    model,
    prompt,
  })

  const generatedImage = response.generatedImages?.[0]
  if (!generatedImage?.image?.imageBytes) {
    throw new Error('No image generated')
  }

  const base64ImageBytes = generatedImage.image.imageBytes
  const buffer = Buffer.from(base64ImageBytes, 'base64')

  return {
    alt: generatedImage.enhancedPrompt || prompt,
    buffer,
  }
}
