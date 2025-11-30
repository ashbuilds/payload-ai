// Re-export everything from registry
export * from './registry.js'

// For backward compatibility, export TEXT_MODEL_OPTIONS
// This will be removed in a future version
import type { ProviderId } from './registry.js'

import { providerRegistry } from './registry.js'

export const TEXT_MODEL_OPTIONS: Record<ProviderId, string[]> = {
  anthropic: providerRegistry.anthropic.models.text || [],
  elevenlabs: [],
  fal: [],
  google: providerRegistry.google.models.text || [],
  openai: providerRegistry.openai.models.text || [],
  'openai-compatible': [],
  xai: providerRegistry.xai.models.text || [],
}

// Backward compatibility: export available providers
export { getEnabledProviders as availableTextProviders } from './registry.js'

// Backward compatibility: export getLanguageModel
export { getLanguageModel } from './registry.js'

