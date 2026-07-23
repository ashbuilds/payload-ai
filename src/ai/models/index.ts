import type { GenerationModel, PluginConfigProviders } from '../../types.js'

import { resolveProviderConfig } from '../providers/resolveProviderConfig.js'
import { createAnthropicConfig } from './anthropic/index.js'
import { createElevenLabsConfig } from './elevenLabs/index.js'
import { createGoogleConfig } from './google/index.js'
import { createMiniMaxConfig } from './minimax/index.js'
import { createOpenAIConfig } from './openai/index.js'

export const getDefaultGenerationModels = (
  providers?: PluginConfigProviders,
): GenerationModel[] => {
  const resolvedProviders = resolveProviderConfig(providers)

  return [
    ...(resolvedProviders.openai.apiKey ? createOpenAIConfig(resolvedProviders.openai).models : []),
    ...(resolvedProviders.anthropic.apiKey || resolvedProviders.anthropic.authToken
      ? createAnthropicConfig(resolvedProviders.anthropic).models
      : []),
    ...(resolvedProviders.google.apiKey ? createGoogleConfig(resolvedProviders.google).models : []),
    ...(resolvedProviders.elevenLabs.apiKey
      ? createElevenLabsConfig(resolvedProviders.elevenLabs).models
      : []),
    ...(resolvedProviders.minimax.apiKey
      ? createMiniMaxConfig(resolvedProviders.minimax).models
      : []),
  ]
}

export const defaultGenerationModels: GenerationModel[] = getDefaultGenerationModels()
