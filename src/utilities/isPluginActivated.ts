import { getGenerationModels } from './getGenerationModels.js'
import { PluginConfig } from '../types.js'

export const isPluginActivated = (pluginConfig: PluginConfig) => {
  return getGenerationModels(pluginConfig).length > 0
}
