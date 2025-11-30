import type { LanguageModel } from 'ai'

import { anthropic as createAnthropic } from '@ai-sdk/anthropic'
import { createElevenLabs } from '@ai-sdk/elevenlabs'
import { fal } from '@ai-sdk/fal'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { xai as createXai } from '@ai-sdk/xai'
import * as process from 'node:process'

export type UseCase = 'image' | 'text' | 'tts' | 'video'
export type ProviderId = 'anthropic' | 'elevenlabs' | 'fal' | 'google' | 'openai' | 'openai-compatible' | 'xai'

export interface ProviderConfig {
  envKey?: string
  // Factory function to create provider instance
  factory?: (config?: any) => any
  id: ProviderId
  // For providers that don't need factory (like fal)
  instance?: any
  models: {
    image?: string[]
    text?: string[]
    tts?: string[]
    video?: string[]
  }
  name: string
}

export const providerRegistry: Record<ProviderId, ProviderConfig> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    factory: (config?: any) =>
      createAnthropic(config),
    models: {
      text: [
        'claude-opus-4-1',
        'claude-opus-4-0',
        'claude-sonnet-4-0',
        'claude-3-opus-latest',
        'claude-3-5-haiku-latest',
        'claude-3-5-sonnet-latest',
        'claude-3-7-sonnet-latest',
      ],
    },
  },
  elevenlabs: {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    envKey: 'ELEVENLABS_API_KEY',
    factory: (config?: any) =>
      createElevenLabs({
        apiKey: config?.apiKey || process.env.ELEVENLABS_API_KEY,
      }),
    models: {
      tts: [
        'eleven_multilingual_v2',
        'eleven_turbo_v2_5',
        'eleven_turbo_v2',
        'eleven_monolingual_v1',
      ],
    },
  },
  fal: {
    id: 'fal',
    name: 'Fal AI',
    envKey: 'FAL_KEY',
    instance: fal,
    models: {
      image: [
        'fal-ai/flux/dev',
        'fal-ai/flux/schnell',
        'fal-ai/flux-pro',
        'fal-ai/flux-realism',
        'fal-ai/aura-flow',
      ],
      video: [
        'fal-ai/kling-video/v1/standard/image-to-video',
        'fal-ai/kling-video/v1/pro/text-to-video',
        'fal-ai/kling-video/v1.5/pro/text-to-video',
        'fal-ai/minimax-video',
        'fal-ai/hunyuan-video',
        'fal-ai/luma-dream-machine',
      ],
    },
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    envKey: 'GOOGLE_GENERATIVE_AI_API_KEY',
    factory: (config?: any) =>
      createGoogleGenerativeAI({
        apiKey: config?.apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      }),
    models: {
      image: ['imagen-3.0-generate-001', 'imagen-3.0-fast-generate-001'],
      text: [
        'gemini-2.0-flash-exp',
        'gemini-exp-1206',
        'gemini-2.0-flash-thinking-exp-1219',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b',
      ],
    },
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    factory: (config?: any) =>
      createOpenAI({
        apiKey: config?.apiKey || process.env.OPENAI_API_KEY,
        baseURL: config?.baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      }),
    models: {
      image: ['dall-e-3', 'dall-e-2', 'gpt-image-1'],
      text: [
        'gpt-5',
        'gpt-5-mini',
        'gpt-5-nano',
        'gpt-4.1',
        'gpt-4o',
        'gpt-4-turbo',
        'gpt-4o-mini',
        'gpt-3.5-turbo',
      ],
      tts: ['tts-1', 'tts-1-hd'],
    },
  },
  'openai-compatible': {
    id: 'openai-compatible',
    name: 'OpenAI Compatible',
    factory: (config?: any) => {
      if (!config?.baseURL) {
        throw new Error('OpenAI-compatible provider requires baseURL config')
      }
      return createOpenAICompatible({
        name: config.name || 'openai-compatible',
        apiKey: config.apiKey || process.env.OPENAI_COMPATIBLE_API_KEY || '',
        baseURL: config.baseURL,
      })
    },
    models: {
      image: [],
      text: [], // User-defined
      tts: [],
      video: [],
    },
  },
  xai: {
    id: 'xai',
    name: 'xAI Grok',
    envKey: 'XAI_API_KEY',
    factory: (config?: any) =>
      createXai(config),
    models: {
      image: ['grok-2-vision-1212', 'grok-vision-beta'],
      text: [
        'grok-4',
        'grok-3',
        'grok-3-fast',
        'grok-3-mini',
        'grok-3-mini-fast',
        'grok-2-1212',
        'grok-2-vision-1212',
        'grok-beta',
        'grok-vision-beta',
      ],
    },
  },
}

/**
 * Check if a provider is enabled (has API key in environment)
 */
export function isProviderEnabled(providerId: ProviderId): boolean {
  const provider = providerRegistry[providerId]
  if (!provider) {return false}
  
  // openai-compatible doesn't require env key (user provides it)
  if (providerId === 'openai-compatible') {return true}
  
  // fal doesn't need factory
  if (provider.instance) {
    return !!process.env[provider.envKey || '']
  }
  
  return provider.envKey ? !!process.env[provider.envKey] : false
}

/**
 * Get all enabled providers
 */
export function getEnabledProviders(): ProviderId[] {
  return (Object.keys(providerRegistry) as ProviderId[]).filter(isProviderEnabled)
}

/**
 * Get available providers for a specific use case
 */
export function getProvidersForUseCase(useCase: UseCase): ProviderId[] {
  return getEnabledProviders().filter((id) => {
    const models = providerRegistry[id].models[useCase]
    return models && models.length > 0
  })
}

/**
 * Get available models for a provider and use case
 */
export function getModelsForProvider(providerId: ProviderId, useCase: UseCase): string[] {
  const provider = providerRegistry[providerId]
  if (!provider) {return []}
  return provider.models[useCase] || []
}

/**
 * Get all available models for a use case (across all enabled providers)
 */
export function getModelsForUseCase(useCase: UseCase): { model: string; provider: ProviderId }[] {
  const providers = getProvidersForUseCase(useCase)
  const models: { model: string; provider: ProviderId }[] = []
  
  providers.forEach((providerId) => {
    const providerModels = getModelsForProvider(providerId, useCase)
    providerModels.forEach((model) => {
      models.push({ model, provider: providerId })
    })
  })
  
  return models
}

/**
 * Get a language model instance
 */
export function getLanguageModel(providerId: ProviderId, modelId: string): LanguageModel {
  const provider = providerRegistry[providerId]
  
  if (!provider) {
    throw new Error(`Provider ${providerId} not found in registry`)
  }
  
  if (!isProviderEnabled(providerId)) {
    throw new Error(
      `Provider ${providerId} is not enabled. Set ${provider.envKey} to enable.`,
    )
  }
  
  // Get provider instance
  let providerInstance: any
  if (provider.instance) {
    providerInstance = provider.instance
  } else if (provider.factory) {
    providerInstance = provider.factory()
  } else {
    throw new Error(`Provider ${providerId} has no factory or instance defined`)
  }
  
  // Return the model
  return providerInstance(modelId)
}

/**
 * Get an image model instance (or provider instance for image generation)
 */
export function getImageModel(providerId: ProviderId, modelId?: string): any {
  const provider = providerRegistry[providerId]
  
  if (!provider) {
    throw new Error(`Provider ${providerId} not found in registry`)
  }
  
  if (!isProviderEnabled(providerId)) {
    throw new Error(
      `Provider ${providerId} is not enabled. Set ${provider.envKey} to enable.`,
    )
  }
  
  // Get provider instance
  if (provider.instance) {
    return provider.instance
  } else if (provider.factory) {
    const providerInstance = provider.factory()
    return modelId ? providerInstance.image(modelId) : providerInstance
  }
  
  throw new Error(`Provider ${providerId} has no factory or instance defined`)
}

/**
 * Get a TTS model instance
 */
export function getTTSModel(providerId: ProviderId, modelId?: string): any {
  const provider = providerRegistry[providerId]
  
  if (!provider) {
    throw new Error(`Provider ${providerId} not found in registry`)
  }
  
  if (!isProviderEnabled(providerId)) {
    throw new Error(
      `Provider ${providerId} is not enabled. Set ${provider.envKey} to enable.`,
    )
  }
  
  // Get provider instance
  if (provider.instance) {
    return provider.instance
  } else if (provider.factory) {
    const providerInstance = provider.factory()
    return modelId ? providerInstance.textToSpeech(modelId) : providerInstance
  }
  
  throw new Error(`Provider ${providerId} has no factory or instance defined`)
}

/**
 * Validate that a provider has all required configuration
 */
export function validateProvider(providerId: ProviderId, config?: any): boolean {
  const provider = providerRegistry[providerId]
  if (!provider) {return false}
  
  if (providerId === 'openai-compatible') {
    return !!(config?.baseURL)
  }
  
  return provider.envKey ? !!process.env[provider.envKey] : true
}

