import { experimental_generateImage, type ImageModel } from 'ai'

import type { ImageGenerationArgs, MediaResult } from '../../types.js'

import { toAISDKProviderOptions } from '../../../../providers/registry.js'
import { getExtensionFromMimeType } from '../../utils.js'

/**
 * Handle standard image generation (DALL-E, Imagen, Flux, etc.)
 * Uses AI SDK's experimental_generateImage
 */
export async function generateStandardImage(
  model: ImageModel,
  args: ImageGenerationArgs,
): Promise<MediaResult> {
  const { n = 1, prompt, provider, providerOptions } = args
  const aiSdkProviderOptions = toAISDKProviderOptions({
    providerId: provider,
    settingsOverride: providerOptions,
  })
  console.log('generateStandardImage:providerOptions: ', aiSdkProviderOptions)

  const generateResult = await experimental_generateImage({
    model,
    n,
    prompt,
    providerOptions: aiSdkProviderOptions,
  })

  const { images } = generateResult

  const files = images.map((image) => {
    const buffer = Buffer.from(image.base64, 'base64')
    const mimeType = image.mediaType || 'image/png'
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
