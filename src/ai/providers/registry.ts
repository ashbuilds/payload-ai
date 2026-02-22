import type { LanguageModel } from 'ai'
import type { Payload } from 'payload'

import * as process from 'node:process'

import { unflattenObject } from '../utilities/unflattenObject.js'

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
  ProviderOption,
  ProviderRegistry,
  XAIBlockData,
} from './types.js'

// Helper to convert array of options back to a record
export function parseProviderOptions(options?: ProviderOption[]): Record<string, any> {
  if (!options || !Array.isArray(options)) {
    return {}
  }
  const flatOptions = options.reduce((acc, opt) => {
    if (!opt.key || !opt.type) {
      return acc
    }
    if (opt.type === 'text' && opt.valueText !== undefined) {
      acc[opt.key] = opt.valueText
    }
    if (opt.type === 'number' && opt.valueNumber !== undefined) {
      acc[opt.key] = opt.valueNumber
    }
    if (opt.type === 'boolean' && opt.valueBoolean !== undefined) {
      acc[opt.key] = opt.valueBoolean
    }
    if (opt.type === 'options' && Array.isArray(opt.valueOptions)) {
      acc[opt.key] = opt.valueOptions.map((o) => o.value)
    }
    return acc
  }, {} as Record<string, any>)

  return unflattenObject(flatOptions)
}

// ─── Cache layer ────────────────────────────────────────────────
// Module-level caches with TTL to avoid redundant DB queries.
// A single text-generation request previously triggered 3 findGlobal
// calls; with this cache the DB is hit at most once per TTL window.

const CACHE_TTL = 60_000 // 60 seconds

interface CacheEntry<T> {
  data: T
  timestamp: number
}

let registryCache: CacheEntry<ProviderRegistry> | null = null
let defaultsCache: CacheEntry<AISettingsData['defaults']> | null = null

// Allow external invalidation (e.g. after saving AISettings)
export function invalidateProviderCache(): void {
  registryCache = null
  defaultsCache = null
}

// ─── Provider factory functions ─────────────────────────────────

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

// ─── Helpers ────────────────────────────────────────────────────

function isProviderBlock<T extends ProviderBlockData>(
  block: ProviderBlockData,
  blockType: T['blockType'],
): block is T {
  return block.blockType === blockType
}

function getFactoryForBlock(providerBlock: ProviderBlockData): (() => Promise<any>) | undefined {
  if (isProviderBlock<OpenAIBlockData>(providerBlock, 'openai')) {
    return () => providerFactories.openai(providerBlock)
  }
  if (isProviderBlock<AnthropicBlockData>(providerBlock, 'anthropic')) {
    return () => providerFactories.anthropic(providerBlock)
  }
  if (isProviderBlock<GoogleBlockData>(providerBlock, 'google')) {
    return () => providerFactories.google(providerBlock)
  }
  if (isProviderBlock<XAIBlockData>(providerBlock, 'xai')) {
    return () => providerFactories.xai(providerBlock)
  }
  if (isProviderBlock<FalBlockData>(providerBlock, 'fal')) {
    return () => providerFactories.fal(providerBlock)
  }
  if (isProviderBlock<ElevenLabsBlockData>(providerBlock, 'elevenlabs')) {
    return () => providerFactories.elevenlabs(providerBlock)
  }
  if (isProviderBlock<OpenAICompatibleBlockData>(providerBlock, 'openai-compatible')) {
    return () => providerFactories['openai-compatible'](providerBlock)
  }
  return undefined
}

/**
 * Resolve the provider SDK instance, caching after first call.
 */
async function resolveProviderInstance(provider: ProviderRegistry[string]): Promise<any> {
  if (provider.instance) {
    return provider.instance
  }
  if (!provider.factory) {
    throw new Error(`Provider ${provider.id} has no factory or instance`)
  }
  const instance = await provider.factory()
  provider.instance = instance
  return instance
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Load provider registry from AI Settings (cached with TTL).
 */
export async function getProviderRegistry(payload: Payload): Promise<ProviderRegistry> {
  if (registryCache && Date.now() - registryCache.timestamp < CACHE_TTL) {
    return registryCache.data
  }

  const settings = (await payload.findGlobal({
    slug: 'ai-providers',
    context: { unsafe: true },
  })) as unknown as AISettingsData

  const registry: ProviderRegistry = {}

  for (const providerBlock of settings.providers || []) {
    if (!providerBlock.enabled) {
      continue
    }

    const { blockType } = providerBlock
    const factory = getFactoryForBlock(providerBlock)

    if (!factory) {
      payload.logger.warn(`— AI Plugin: No factory for provider: ${blockType}`)
      continue
    }

    const enabledModels = providerBlock.models.filter((m) => m.enabled)


    registry[blockType] = {
      id: blockType,
      name: 'providerName' in providerBlock ? providerBlock.providerName : blockType,
      apiKey: 'apiKey' in providerBlock ? providerBlock.apiKey : undefined,
      enabled: true,
      factory,
      instance: undefined,
      models: enabledModels,

    }
  }

  // Also cache defaults from the same settings fetch to save a second query
  defaultsCache = { data: settings.defaults, timestamp: Date.now() }
  registryCache = { data: registry, timestamp: Date.now() }

  return registry
}

/**
 * Get global defaults from AI Settings (cached with TTL).
 */
export async function getGlobalDefaults(payload: Payload) {
  if (defaultsCache && Date.now() - defaultsCache.timestamp < CACHE_TTL) {
    return defaultsCache.data
  }

  const settings = (await payload.findGlobal({
    slug: 'ai-providers',
  })) as unknown as AISettingsData

  defaultsCache = { data: settings.defaults, timestamp: Date.now() }
  return settings.defaults
}

/**
 * Get language model (cached registry + single defaults call).
 */
export async function getLanguageModel(
  payload: Payload,
  providerId?: string,
  modelId?: string,
): Promise<LanguageModel> {
  // Single defaults fetch for the entire function
  const defaults = !providerId || !modelId ? await getGlobalDefaults(payload) : null

  if (!providerId) {
    providerId = defaults?.text?.provider
  }
  if (!modelId) {
    modelId = defaults?.text?.model
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

  const globalDefaultOptions =
    defaults?.text?.provider === providerId
      ? parseProviderOptions(defaults?.text?.providerOptions)
      : {}

  const providerInstance = await resolveProviderInstance(provider)
  return providerInstance(modelId, globalDefaultOptions)
}

/**
 * Get image model (cached registry + single defaults call).
 */
export async function getImageModel(
  payload: Payload,
  providerId?: string,
  modelId?: string,
  isMultimodalText?: boolean,
) {
  const defaults = !providerId || !modelId ? await getGlobalDefaults(payload) : null

  if (!providerId) {
    providerId = defaults?.image?.provider
  }
  if (!modelId) {
    modelId = defaults?.image?.model
  }


  if (!providerId || !modelId) {
    throw new Error('Provider and model must be specified or configured in defaults')
  }

  const registry = await getProviderRegistry(payload)
  const provider = registry[providerId]

  if (!provider) {
    throw new Error(`Provider ${providerId} not found`)
  }

  const globalDefaultOptions =
    defaults?.image?.provider === providerId
      ? parseProviderOptions(defaults?.image?.providerOptions)
      : {}

  const instance = await resolveProviderInstance(provider)

  // Type-safe check for image support
  if (
    !isMultimodalText &&
    typeof instance === 'function' &&
    'image' in instance &&
    typeof instance.image === 'function'
  ) {
    return instance.image(modelId, globalDefaultOptions)
  }

  // Also check if instance is an object with image method
  if (
    typeof instance === 'object' &&
    instance !== null &&
    'image' in instance &&
    !isMultimodalText
  ) {
    return (instance as AIProvider).image?.(modelId, globalDefaultOptions)
  }

  // Fallback for providers that might return the model directly
  return typeof instance === 'function' ? instance(modelId, globalDefaultOptions) : instance
}

/**
 * Get TTS model (cached registry + single defaults call).
 */
export async function getTTSModel(
  payload: Payload,
  providerId?: string,
  modelId?: string,
) {
  const defaults = !providerId || !modelId ? await getGlobalDefaults(payload) : null

  if (!providerId) {
    providerId = defaults?.tts?.provider
  }
  if (!modelId) {
    modelId = defaults?.tts?.model
  }


  if (!providerId || !modelId) {
    throw new Error('Provider and model must be specified or configured in defaults')
  }

  const registry = await getProviderRegistry(payload)
  const provider = registry[providerId]

  if (!provider) {
    throw new Error(`Provider ${providerId} not found`)
  }

  const globalDefaultOptions =
    defaults?.tts?.provider === providerId
      ? parseProviderOptions(defaults?.tts?.providerOptions)
      : {}

  const instance = await resolveProviderInstance(provider)

  if (instance?.speech) {
    return instance.speech(modelId, globalDefaultOptions)
  }
  return typeof instance === 'function' ? instance(modelId, globalDefaultOptions) : instance
}
