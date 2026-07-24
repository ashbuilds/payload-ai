import type { PluginConfig } from '../types.js'

import { getDefaultGenerationModels } from '../ai/models/index.js'

export function getGenerationModels(pluginConfig: PluginConfig) {
  const { generationModels } = pluginConfig
  const defaultGenerationModels = getDefaultGenerationModels(pluginConfig.providers)

  if (typeof generationModels === 'function') {
    return generationModels(defaultGenerationModels)
  }

  return generationModels ?? defaultGenerationModels
}
