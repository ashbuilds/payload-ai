import type { PluginConfig } from '../types.js'

import { getGenerationModels } from './getGenerationModels.js'

export const isPluginActivated = (pluginConfig: PluginConfig) => {
  return (getGenerationModels(pluginConfig) ?? []).length > 0
}
