import { createOpenAI } from '@ai-sdk/openai'

import type { ResolvedProviderConfig } from '../../providers/resolveProviderConfig.js'

import { resolveProviderConfig } from '../../providers/resolveProviderConfig.js'

export const createMiniMaxProvider = (providerConfig = resolveProviderConfig().minimax) =>
  createOpenAI({
    name: 'minimax',
    apiKey: providerConfig.apiKey,
    baseURL: providerConfig.baseURL,
    headers: providerConfig.headers,
  })

export const minimax = createMiniMaxProvider()

export type MiniMaxResolvedProviderConfig = ResolvedProviderConfig['minimax']
