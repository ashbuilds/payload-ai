import type { GenerationModel } from '../../types.js'

import { getEnabledProviders } from '../providers/index.js'
import { ImageConfig } from './image.js'
import { TextConfig } from './text.js'
import { TTSConfig } from './tts.js'
import { VideoConfig } from './video.js'

// Build the default model list from unified configs using the provider registry
const models: GenerationModel[] = []

// Add text models if any text provider is enabled
const enabledProviders = getEnabledProviders()
const hasTextProvider = enabledProviders.some((id) =>
  ['anthropic', 'google', 'openai', 'xai'].includes(id),
)
if (hasTextProvider) {
  models.push(...TextConfig.models)
}

// Add image models if any image provider is enabled
const hasImageProvider = enabledProviders.some((id) =>
  ['fal', 'google', 'openai', 'xai'].includes(id),
)
if (hasImageProvider) {
  models.push(...ImageConfig.models)
}

// Add TTS models if any TTS provider is enabled
const hasTTSProvider = enabledProviders.some((id) => ['elevenlabs', 'openai'].includes(id))
if (hasTTSProvider) {
  models.push(...TTSConfig.models)
}

// Add video models if Fal is enabled
if (enabledProviders.includes('fal')) {
  models.push(...VideoConfig.models)
}

export const defaultGenerationModels: GenerationModel[] = models
