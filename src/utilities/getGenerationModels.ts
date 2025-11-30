import type { PluginConfig } from '../types.js'

import { defaultGenerationModels } from '../ai/models/index.js'

export function getGenerationModels(
  pluginConfig: PluginConfig,
) {
  const { generationModels } = pluginConfig
  if (typeof generationModels === 'function') {
    return generationModels(defaultGenerationModels)
  }
  return generationModels
}
