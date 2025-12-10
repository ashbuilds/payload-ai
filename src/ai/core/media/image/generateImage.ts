import type { ImageModel, LanguageModel } from 'ai'

import type { ImageGenerationArgs, MediaResult } from '../types.js'

import { getImageModel, getProviderRegistry } from '../../../providers/registry.js'
import { generateMultimodalImage } from './handlers/multimodal.js'
import { generateStandardImage } from './handlers/standard.js'

/**
 * Main image generation handler
 * Routes to appropriate handler based on model capabilities
 */
export async function generateImage(args: ImageGenerationArgs): Promise<MediaResult> {
  const { model: modelId, payload, provider } = args
  console.log('args: ', args.images)
  // Get provider registry and model configuration
  const registry = await getProviderRegistry(payload)
  const providerConfig = registry[provider || '']

  if (!providerConfig) {
    throw new Error(`Provider ${provider} not found in registry`)
  }

  const modelConfig = providerConfig.models?.find((m) => m.id === modelId)

  // Determine if this is a multimodal text-to-image model
  const isMultimodalText = modelConfig?.responseModalities?.includes('IMAGE') ?? false

  // Get appropriate model instance
  const model = await getImageModel(
    payload,
    provider,
    modelId,
    args.providerOptions,
    isMultimodalText,
  )
  console.log('isMultimodalText : ', isMultimodalText)
  console.log('modelConfig : ', modelConfig)
  console.log('model : ', model)
  if (isMultimodalText) {
    return generateMultimodalImage(model as LanguageModel, args)
  }

  return generateStandardImage(model as ImageModel, args)
}
