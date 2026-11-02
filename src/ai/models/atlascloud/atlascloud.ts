import { createOpenAI } from '@ai-sdk/openai'

import type { ResolvedProviderConfig } from '../../providers/resolveProviderConfig.js'

import { resolveProviderConfig } from '../../providers/resolveProviderConfig.js'

export const createAtlasCloudProvider = (providerConfig = resolveProviderConfig().atlascloud) =>
  createOpenAI({
    name: 'atlascloud',
    apiKey: providerConfig.apiKey,
    baseURL: providerConfig.baseURL,
    headers: providerConfig.headers,
  })

export const atlascloud = createAtlasCloudProvider()

export type AtlasCloudResolvedProviderConfig = ResolvedProviderConfig['atlascloud']
