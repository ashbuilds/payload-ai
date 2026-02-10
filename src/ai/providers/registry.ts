import type { LanguageModel } from 'ai'
import type { Payload } from 'payload'

export type { ProviderId } from './types.js'

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
  anthropic: async (block: AnthropicBlockData) => {
    const { createAnthropic } = await import('@ai-sdk/anthropic')
    return createAnthropic({
      apiKey: block.apiKey,
    })
  },

  elevenlabs: async (block: ElevenLabsBlockData) => {
    const { createElevenLabs } = await import('@ai-sdk/elevenlabs')
    return createElevenLabs({
      apiKey: block.apiKey,
    })
  },

  fal: async (block: FalBlockData) => {
    const { fal } = await import('@ai-sdk/fal')
    // Fal uses global instance, configure with apiKey
    process.env.FAL_KEY = block.apiKey
    if (block.webhookSecret) {
      process.env.FAL_WEBHOOK_SECRET = block.webhookSecret
    }
    return fal
  },

  google: async (block: GoogleBlockData) => {
    const { createGoogleGenerativeAI } = await import('@ai-sdk/google')
    return createGoogleGenerativeAI({
      apiKey: block.apiKey,
    })
  },

  openai: async (block: OpenAIBlockData) => {
    const { createOpenAI } = await import('@ai-sdk/openai')
    return createOpenAI({
      apiKey: block.apiKey,
      baseURL: block.baseURL || 'https://api.openai.com/v1',
      organization: block.organization,
    })
  },

  'openai-compatible': async (block: OpenAICompatibleBlockData) => {
    console.log('OpenAI compatible, ', block)
    const { createOpenAICompatible } = await import('@ai-sdk/openai-compatible')
    return createOpenAICompatible({
      name: block.providerName,
      apiKey: block.apiKey || '',
      baseURL: block.baseURL,
    })
  },

  xai: async (block: XAIBlockData) => {
    const { createXai } = await import('@ai-sdk/xai')
    return createXai({
      apiKey: block.apiKey,
    })
  },
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
    slug: 'ai-providers',
    context: { unsafe: true },
  })) as unknown as AISettingsData

  const registry: ProviderRegistry = {}
  // console.log('settings - >', JSON.stringify(settings, null, 2))
  for (const providerBlock of settings.providers || []) {
    if (!providerBlock.enabled) {
      continue
    }

    const { blockType } = providerBlock

    // Type-safe factory lookup and invocation
    let factory: (() => Promise<any>) | undefined

    if (isProviderBlock<OpenAIBlockData>(providerBlock, 'openai')) {
      factory = () => providerFactories.openai(providerBlock)
    } else if (isProviderBlock<AnthropicBlockData>(providerBlock, 'anthropic')) {
      factory = () => providerFactories.anthropic(providerBlock)
    } else if (isProviderBlock<GoogleBlockData>(providerBlock, 'google')) {
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

    // Extract provider options
    const options = {
      image:
        'imageProviderOptions' in providerBlock ? providerBlock.imageProviderOptions : undefined,
      text: 'textProviderOptions' in providerBlock ? providerBlock.textProviderOptions : undefined,
      tts: 'ttsProviderOptions' in providerBlock ? providerBlock.ttsProviderOptions : undefined,
    }

    registry[blockType] = {
      id: blockType,
      name: 'providerName' in providerBlock ? providerBlock.providerName : blockType,
      apiKey: 'apiKey' in providerBlock ? providerBlock.apiKey : undefined,
      enabled: true,
      factory,
      instance: undefined, // Fal is now loaded dynamically via factory
      models: enabledModels,
      options,
    }
  }

  return registry
}

/**
 * Get global defaults from AI Settings
 */
export async function getGlobalDefaults(payload: Payload) {
  const settings = (await payload.findGlobal({
    slug: 'ai-providers',
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
  options?: Record<string, any>,
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

  // Extract global default options if we are using the default provider
  let globalDefaultOptions = {}
  if (providerId) {
    const defaults = await getGlobalDefaults(payload)
    if (defaults?.text?.provider === providerId) {
      globalDefaultOptions = defaults?.text?.options || {}
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

  // We only support factory now for dynamic loading, instance is legacy/cache
  let providerInstance: any
  if (provider.instance) {
    providerInstance = provider.instance
  } else if (provider.factory) {
    providerInstance = await provider.factory()
  } else {
    throw new Error(`Provider ${providerId} has no factory or instance`)
  }

  // Merge default settings with override options
  const finalOptions = {
    ...(provider.options?.text || {}),
    ...globalDefaultOptions,
    ...(options || {}),
  }

  return providerInstance(modelId, finalOptions)
}

export async function getImageModel(
  payload: Payload,
  providerId?: string,
  modelId?: string,
  options?: Record<string, any>,
  isMultimodalText?: boolean,
) {
  if (!providerId || !modelId) {
    const defaults = await getGlobalDefaults(payload)
    if (!providerId) {
      providerId = defaults?.image?.provider
    }
    if (!modelId) {
      modelId = defaults?.image?.model
    }
  }

  // Extract global default options if we are using the default provider
  let globalDefaultOptions = {}
  if (providerId) {
    const defaults = await getGlobalDefaults(payload)
    if (defaults?.image?.provider === providerId) {
      globalDefaultOptions = defaults?.image?.options || {}
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

  // Merge default settings with override options
  const finalOptions = {
    ...(provider.options?.image || {}),
    ...globalDefaultOptions,
    ...(options || {}),
  }

  if (provider.instance) {
    return provider.instance
  }

  if (provider.factory) {
    const instance = await provider.factory()

    // Type-safe check for image support
    if (
      !isMultimodalText &&
      typeof instance === 'function' &&
      'image' in instance &&
      typeof instance.image === 'function'
    ) {
      return instance.image(modelId, finalOptions)
    }

    // Also check if instance is an object with image method
    if (
      typeof instance === 'object' &&
      instance !== null &&
      'image' in instance &&
      !isMultimodalText
    ) {
      return (instance as AIProvider).image?.(modelId, finalOptions)
    }

    // Fallback for providers that might return the model directly or use the default factory
    return typeof instance === 'function' ? instance(modelId, finalOptions) : instance
  }

  throw new Error(`Invalid provider configuration for ${providerId}`)
}

export async function getTTSModel(
  payload: Payload,
  providerId?: string,
  modelId?: string,
  options?: Record<string, any>,
) {
  if (!providerId || !modelId) {
    const defaults = await getGlobalDefaults(payload)
    if (!providerId) {
      providerId = defaults?.tts?.provider
    }
    if (!modelId) {
      modelId = defaults?.tts?.model
    }
  }

  // Extract global default options if we are using the default provider
  let globalDefaultOptions = {}
  if (providerId) {
    const defaults = await getGlobalDefaults(payload)
    if (defaults?.tts?.provider === providerId) {
      globalDefaultOptions = defaults?.tts?.options || {}
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

  // Merge default settings with override options
  const finalOptions = {
    ...(provider.options?.tts || {}),
    ...globalDefaultOptions,
    ...(options || {}),
  }

  if (provider.factory) {
    const instance = await provider.factory()
    if (instance?.speech) {
      return instance.speech(modelId, finalOptions)
    }
    return typeof instance === 'function' ? instance(modelId, finalOptions) : instance
  }

  throw new Error(`Invalid provider configuration for ${providerId}`)
}
