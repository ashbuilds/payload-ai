import type { PluginConfig } from '../types.js'

export const isPluginActivated = (pluginConfig: PluginConfig) => {
  return !!pluginConfig
}
