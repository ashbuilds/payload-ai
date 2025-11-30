import type { LanguageModel } from 'ai'

export type UseCase = 'image' | 'text' | 'tts' | 'video'

export type ProviderId =
  | 'anthropic'
  | 'elevenlabs'
  | 'fal'
  | 'google'
  | 'openai'
  | 'openai-compatible'
  | 'xai'

// Base block data structure
export interface BaseProviderBlock {
  blockType: string
  enabled: boolean
  models: ProviderModel[]
}

export interface ProviderModel {
  enabled: boolean
  id: string
  name: string
  useCase: UseCase
}

// Provider-specific block types
export interface OpenAIBlockData extends BaseProviderBlock {
  apiKey: string
  baseURL?: string
  blockType: 'openai'
  organization?: string
  supportedUseCases: UseCase[]
}

export interface AnthropicBlockData extends BaseProviderBlock {
  apiKey: string
  blockType: 'anthropic'
  supportedUseCases: ['text']
}

export interface GoogleBlockData extends BaseProviderBlock {
  apiKey: string
  blockType: 'google'
  supportedUseCases: ('image' | 'text')[]
}

export interface XAIBlockData extends BaseProviderBlock {
  apiKey: string
  blockType: 'xai'
  supportedUseCases: ('image' | 'text')[]
}

export interface FalBlockData extends BaseProviderBlock {
  apiKey: string
  blockType: 'fal'
  supportedUseCases: ('image' | 'video')[]
  webhookSecret?: string
}

export interface ElevenLabsBlockData extends BaseProviderBlock {
  apiKey: string
  blockType: 'elevenlabs'
  supportedUseCases: ['tts']
}

export interface OpenAICompatibleBlockData extends BaseProviderBlock {
  apiKey?: string
  baseURL: string
  blockType: 'openai-compatible'
  providerName: string
  supportedUseCases: UseCase[]
}

// Union type for all provider blocks
export type ProviderBlockData =
  | AnthropicBlockData
  | ElevenLabsBlockData
  | FalBlockData
  | GoogleBlockData
  | OpenAIBlockData
  | OpenAICompatibleBlockData
  | XAIBlockData

// Provider registry types
export interface ProviderConfig {
  apiKey?: string
  enabled: boolean
  factory: () => any // Provider instance factory
  id: string
  instance?: any // For providers like fal that use singleton
  models: ProviderModel[]
  name: string
}

export type ProviderRegistry = Record<string, ProviderConfig>

// AI Settings global data structure
export interface AISettingsData {
  defaults: {
    image?: { model: string; provider: string }
    text?: { model: string; provider: string }
    tts?: { model: string; provider: string }
    video?: { model: string; provider: string }
  }
  providers: ProviderBlockData[]
}
