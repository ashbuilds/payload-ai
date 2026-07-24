import { createOpenAI } from '@ai-sdk/openai'

import type { ResolvedProviderConfig } from '../../providers/resolveProviderConfig.js'

import { resolveProviderConfig } from '../../providers/resolveProviderConfig.js'

export const createOpenAIProvider = (providerConfig = resolveProviderConfig().openai) =>
  createOpenAI({
    apiKey: providerConfig.apiKey,
    baseURL: providerConfig.baseURL,
    headers: providerConfig.headers,
    organization: providerConfig.organization,
    project: providerConfig.project,
  })

// Backwards-compatible default export shape for consumers importing the internal provider.
export const openai = createOpenAIProvider()

export type OpenAIResolvedProviderConfig = ResolvedProviderConfig['openai']
