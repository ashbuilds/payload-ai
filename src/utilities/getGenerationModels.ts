import { defaultGenerationModels } from '../ai/models/index.js'
import { PluginConfig } from '../types.js'

export function getGenerationModels(
  pluginConfig: PluginConfig,
) {
  const { generationModels } = pluginConfig
  if (typeof generationModels === 'function') {
    return generationModels(defaultGenerationModels)
  }
  return generationModels
}
