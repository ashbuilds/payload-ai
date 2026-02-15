import { generateText, type LanguageModel, ModelMessage } from 'ai'

import type { ImageGenerationArgs, MediaResult, MultimodalImageFile } from '../../types.js'

import { convertToBuffer, getExtensionFromMimeType } from '../../utils.js'

/**
 * Handle multimodal text-to-image generation (e.g., Gemini Nano Banana)
 * Uses generateText with image response modalities
 */
export async function generateMultimodalImage(
  model: LanguageModel,
  args: ImageGenerationArgs,
): Promise<MediaResult> {
  const { images = [], prompt, providerOptions = {} } = args

  // Build Google-specific options with required defaults
  const googleOptions = {
    imageConfig: {
      aspectRatio: args.aspectRatio || providerOptions?.aspectRatio || '16:9',
      ...(providerOptions?.personGeneration && { personGeneration: providerOptions.personGeneration }),
      ...(providerOptions?.addWatermark !== undefined && { addWatermark: providerOptions.addWatermark }),
    },
    responseModalities: ['IMAGE', 'TEXT'],
  }
  
  const result = await generateText({
    model,
    // onStepFinish: (step) => {
    //   console.log('step finish: ', step.files)
    //   console.log('step finish: ', step.response)
    // },
    prompt: [
      {
        content: [{ type: 'text', text: prompt }, ...images],
        role: 'user',
      },
    ],
    providerOptions: {
      google: googleOptions,
    },
  })

  // Extract images from result.files
  const resultImages = (result.files?.filter((f: MultimodalImageFile) =>
    f.mediaType?.startsWith('image/'),
  ) || []) as MultimodalImageFile[]

  if (resultImages.length === 0) {
    // Check if Google returned a specific error message
    const responseBody = result.response?.body as { candidates?: Array<{ finishMessage?: string; finishReason?: string }> } | undefined
    const candidate = responseBody?.candidates?.[0]
    
    if (candidate?.finishMessage) {
      throw new Error(`Image generation failed: ${candidate.finishMessage}`)
    }
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
      throw new Error(`Image generation failed with reason: ${candidate.finishReason}`)
    }
    
    throw new Error('No images returned from the model. The model may have generated only text.')
  }

  const files = resultImages.map((image) => {
    const mimeType = image.mediaType || 'image/png'
    const imageData = image.base64Data || image.uint8Array

    if (!imageData) {
      throw new Error('Image data is missing from the response.')
    }

    const buffer = convertToBuffer(imageData)
    const extension = getExtensionFromMimeType(mimeType)

    return {
      name: `generated.${extension}`,
      data: buffer,
      mimetype: mimeType,
      size: buffer.byteLength,
    }
  })

  return {
    files,
  }
}
