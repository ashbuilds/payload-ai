import type { ImageReference } from '../../types.js'
import type { OpenAIResolvedProviderConfig } from '../models/openai/openai.js'

import { resolveProviderConfig } from '../providers/resolveProviderConfig.js'

/**
 * Send multiple images as `image[]` to OpenAI's image edit endpoint using gpt-image-1.
 * @param images
 * @param prompt Prompt to guide the image edit
 * @param model
 * @returns base64 string of the edited image
 * @note: Remove this function, once https://github.com/openai/openai-node/issues/1492 is fixed.
 */
export async function editImagesWithOpenAI(
  images: ImageReference[],
  prompt: string,
  model: string = 'gpt-image-1',
  providerConfig: OpenAIResolvedProviderConfig = resolveProviderConfig().openai,
) {
  try {
    const formData = new FormData()

    for (const [_, img] of images.entries()) {
      const extension = img.data.type.split('/')[1]
      formData.append('image[]', img.data, `${img.name}.${extension}`)
    }

    formData.append('prompt', prompt)
    formData.append('model', model)

    const baseURL = providerConfig.baseURL
    const openaiRes = await fetch(`${baseURL}/images/edits`, {
      body: formData,
      headers: {
        Authorization: `Bearer ${providerConfig.apiKey}`,
        'OpenAI-Organization': providerConfig.organization || '',
        ...(providerConfig.headers ?? {}),
      },
      method: 'POST',
    })

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text()
      throw new Error(`OpenAI edit error: ${openaiRes.status} - ${errorText}`)
    }

    return openaiRes.json()
  } catch (e) {
    console.error('Error editing images: ', e)
    throw Error(
      'Image edit request failed. Please ensure the images are accessible and hosted publicly.',
    )
  }
}
