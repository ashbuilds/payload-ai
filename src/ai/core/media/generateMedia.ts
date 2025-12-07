import type { PayloadGenerateMediaArgs } from '../types.js'
import type { MediaResult } from './types.js'

import { getProviderRegistry } from '../../providers/registry.js'
import { generateImage } from './image/index.js'
import { generateSpeech } from './speech/index.js'
import { generateVideo } from './video/index.js'

/**
 * Detect media type from provider and model configuration
 */
async function detectMediaType(
  args: PayloadGenerateMediaArgs,
): Promise<'image' | 'speech' | 'video'> {
  const { model: modelId, payload, provider } = args

  if (!provider) {
    throw new Error('Provider is required for media generation')
  }

  const registry = await getProviderRegistry(payload)
  const providerConfig = registry[provider]

  if (!providerConfig) {
    throw new Error(`Provider ${provider} not found in registry`)
  }

  // Check for video (Fal + video use case)
  const isVideo =
    providerConfig.id === 'fal' &&
    providerConfig.models?.find((m) => m.id === modelId)?.useCase === 'video'

  if (isVideo) {
    return 'video'
  }

  // Check for speech (TTS)
  const isTTS =
    providerConfig.id === 'elevenlabs' ||
    (providerConfig.id === 'openai' && modelId?.startsWith('tts'))

  if (isTTS) {
    return 'speech'
  }

  // Default to image
  return 'image'
}

/**
 * Unified media generation handler
 * Routes to appropriate specialized handler based on media type
 */
export async function generateMedia(args: PayloadGenerateMediaArgs): Promise<MediaResult> {
  if (!args.prompt || !args.prompt.trim()) {
    throw new Error('Prompt is required for media generation')
  }

  const mediaType = await detectMediaType(args)

  switch (mediaType) {
    case 'image':
      return generateImage(args)
    case 'speech':
      return generateSpeech(args)
    case 'video':
      return generateVideo(args)
    default:
      throw new Error(`Unsupported media type: ${mediaType}`)
  }
}
