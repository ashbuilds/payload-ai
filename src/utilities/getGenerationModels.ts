import { getDefaultGenerationModels } from '../ai/models/index.js'
import { PluginConfig } from '../types.js'

export function getGenerationModels(
  pluginConfig: PluginConfig,
) {
  const { generationModels } = pluginConfig
  const defaultGenerationModels = getDefaultGenerationModels()

  if (typeof generationModels === 'function') {
    return generationModels(defaultGenerationModels)
  }

  return generationModels ?? defaultGenerationModels
}
