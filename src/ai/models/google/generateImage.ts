import { GoogleGenAI } from '@google/genai'

import type { GenerateImageParams } from '../../../types.js'

export const generateImage = async (
  prompt: string,
  {
    aspectRatio = '1:1',
    model = 'imagen-4.0-fast-generate-001',
    numberOfImages = 1,
    outputMimeType = 'image/png',
  }: GenerateImageParams & {
    aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'
    model?: string
    numberOfImages?: number
    outputMimeType?: 'image/jpeg' | 'image/png'
  } = {},
) => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  })

  const response = await ai.models.generateImages({
    model,
    prompt,
    config: {
      numberOfImages,
      aspectRatio,
      outputMimeType,
    },
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

