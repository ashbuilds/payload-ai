import { experimental_generateImage, type ImageModel } from 'ai'

import type { ImageGenerationArgs, MediaResult } from '../../types.js'

import { getExtensionFromMimeType } from '../../utils.js'

/**
 * Handle standard image generation (DALL-E, Imagen, Flux, etc.)
 * Uses AI SDK's experimental_generateImage
 */
export async function generateStandardImage(
  model: ImageModel,
  args: ImageGenerationArgs,
): Promise<MediaResult> {
  const { n = 1, prompt, providerOptions } = args

  const generateResult = await experimental_generateImage({
    model,
    n,
    prompt,
    providerOptions,
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
