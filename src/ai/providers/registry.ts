import type { LanguageModel } from 'ai'
import type { Payload } from 'payload'

export type { ProviderId } from './types.js'

import { createAnthropic } from '@ai-sdk/anthropic'
import { createElevenLabs } from '@ai-sdk/elevenlabs'
import { fal } from '@ai-sdk/fal'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createXai } from '@ai-sdk/xai'
import * as process from 'node:process'

import type {
  AIProvider,
  AISettingsData,
  AnthropicBlockData,
  ElevenLabsBlockData,
  FalBlockData,
  GoogleBlockData,
  OpenAIBlockData,
  OpenAICompatibleBlockData,
  ProviderBlockData,
  ProviderRegistry,
  XAIBlockData,
} from './types.js'

// Type-safe provider factory functions
const providerFactories = {
  anthropic: (block: AnthropicBlockData) =>
    createAnthropic({
      apiKey: block.apiKey,
    }),

  elevenlabs: (block: ElevenLabsBlockData) =>
    createElevenLabs({
      apiKey: block.apiKey,
    }),

  fal: (block: FalBlockData) => {
    // Fal uses global instance, configure with apiKey
    process.env.FAL_KEY = block.apiKey
    if (block.webhookSecret) {
      process.env.FAL_WEBHOOK_SECRET = block.webhookSecret
    }
    return fal
  },

  google: (block: GoogleBlockData) =>
    createGoogleGenerativeAI({
      apiKey: block.apiKey,
    }),

  openai: (block: OpenAIBlockData) =>
    createOpenAI({
      apiKey: block.apiKey,
      baseURL: block.baseURL || 'https://api.openai.com/v1',
      organization: block.organization,
    }),

  'openai-compatible': (block: OpenAICompatibleBlockData) =>
    createOpenAICompatible({
      name: block.providerName,
      apiKey: block.apiKey || '',
      baseURL: block.baseURL,
    }),

  xai: (block: XAIBlockData) =>
    createXai({
      apiKey: block.apiKey,
    }),
}

/**
 * Type guard to check provider block type
 */
function isProviderBlock<T extends ProviderBlockData>(
  block: ProviderBlockData,
  blockType: T['blockType'],
): block is T {
  return block.blockType === blockType
}

/**
 * Load provider registry from AI Settings (type-safe)
 */
export async function getProviderRegistry(payload: Payload): Promise<ProviderRegistry> {
  const settings = (await payload.findGlobal({
    slug: 'ai-settings',
    context: { unsafe: true },
  })) as unknown as AISettingsData

  const registry: ProviderRegistry = {}
  console.log('settings - >', JSON.stringify(settings, null, 2))
  for (const providerBlock of settings.providers || []) {
    if (!providerBlock.enabled) {
      continue
    }

    const { blockType } = providerBlock

    // Type-safe factory lookup and invocation
    let factory: (() => any) | undefined

    if (isProviderBlock<OpenAIBlockData>(providerBlock, 'openai')) {
      factory = () => providerFactories.openai(providerBlock)
    } else if (isProviderBlock<AnthropicBlockData>(providerBlock, 'anthropic')) {
      factory = () => providerFactories.anthropic(providerBlock)
    } else if (isProviderBlock<GoogleBlockData>(providerBlock, 'google')) {
      console.log("providerBlock:  ", providerBlock)
      factory = () => providerFactories.google(providerBlock)
    } else if (isProviderBlock<XAIBlockData>(providerBlock, 'xai')) {
      factory = () => providerFactories.xai(providerBlock)
    } else if (isProviderBlock<FalBlockData>(providerBlock, 'fal')) {
      factory = () => providerFactories.fal(providerBlock)
    } else if (isProviderBlock<ElevenLabsBlockData>(providerBlock, 'elevenlabs')) {
      factory = () => providerFactories.elevenlabs(providerBlock)
    } else if (isProviderBlock<OpenAICompatibleBlockData>(providerBlock, 'openai-compatible')) {
      factory = () => providerFactories['openai-compatible'](providerBlock)
    }

    if (!factory) {
      console.warn(`No factory for provider: ${blockType}`)
      continue
    }

    // Filter enabled models only
    const enabledModels = providerBlock.models.filter((m) => m.enabled)

    registry[blockType] = {
      id: blockType,
      name: 'providerName' in providerBlock ? providerBlock.providerName : blockType,
      apiKey: 'apiKey' in providerBlock ? providerBlock.apiKey : undefined,
      enabled: true,
      factory,
      instance: blockType === 'fal' ? fal : undefined,
      models: enabledModels,
    }
  }

  return registry
}

/**
 * Get global defaults from AI Settings
 */
export async function getGlobalDefaults(payload: Payload) {
  const settings = (await payload.findGlobal({
    slug: 'ai-settings',
  })) as unknown as AISettingsData
  return settings.defaults
}

/**
 * Get language model (type-safe, async)
 */
export async function getLanguageModel(
  payload: Payload,
  providerId?: string,
  modelId?: string,
): Promise<LanguageModel> {
  if (!providerId || !modelId) {
    const defaults = await getGlobalDefaults(payload)
    if (!providerId) {
      providerId = defaults?.text?.provider
    }
    if (!modelId) {
      modelId = defaults?.text?.model
    }
  }

  if (!providerId || !modelId) {
    throw new Error('Provider and model must be specified or configured in defaults')
  }

  const registry = await getProviderRegistry(payload)
  const provider = registry[providerId]

  if (!provider) {
    throw new Error(`Provider ${providerId} not found in registry`)
  }

  if (!provider.enabled) {
    throw new Error(`Provider ${providerId} is not enabled`)
  }

  let providerInstance: any
  if (provider.instance) {
    providerInstance = provider.instance
  } else if (provider.factory) {
    providerInstance = provider.factory()
  } else {
    throw new Error(`Provider ${providerId} has no factory or instance`)
  }

  return providerInstance(modelId)
}

export async function getImageModel(payload: Payload, providerId?: string, modelId?: string) {
  if (!providerId || !modelId) {
    const defaults = await getGlobalDefaults(payload)
    if (!providerId) {
      providerId = defaults?.image?.provider
    }
    if (!modelId) {
      modelId = defaults?.image?.model
    }
  }

  if (!providerId || !modelId) {
    throw new Error('Provider and model must be specified or configured in defaults')
  }

  const registry = await getProviderRegistry(payload)
  const provider = registry[providerId]

  if (!provider) {
    throw new Error(`Provider ${providerId} not found`)
  }

  if (provider.instance) {
    return provider.instance
  }

  if (provider.factory) {
    const instance = provider.factory()

    // Type-safe check for image support
    if (
      typeof instance === 'function' &&
      'image' in instance &&
      typeof instance.image === 'function'
    ) {
      return instance.image(modelId)
    }

    // Also check if instance is an object with image method (though usually it's a function + properties)
    if (typeof instance === 'object' && instance !== null && 'image' in instance) {
      return (instance as AIProvider).image?.(modelId)
    }

    // Fallback for providers that might return the model directly or use the default factory
    return typeof instance === 'function' ? instance(modelId) : instance
  }

  throw new Error(`Invalid provider configuration for ${providerId}`)
}

export async function getTTSModel(payload: Payload, providerId?: string, modelId?: string) {
  if (!providerId || !modelId) {
    const defaults = await getGlobalDefaults(payload)
    if (!providerId) {
      providerId = defaults?.tts?.provider
    }
    if (!modelId) {
      modelId = defaults?.tts?.model
    }
  }

  if (!providerId || !modelId) {
    throw new Error('Provider and model must be specified or configured in defaults')
  }

  const registry = await getProviderRegistry(payload)
  const provider = registry[providerId]

  if (!provider) {
    throw new Error(`Provider ${providerId} not found`)
  }

  if (provider.factory) {
    const instance = provider.factory()
    return typeof instance === 'function' ? instance(modelId) : instance
  }

  throw new Error(`Invalid provider configuration for ${providerId}`)
}
