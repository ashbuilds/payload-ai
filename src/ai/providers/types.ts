import type { LanguageModel } from 'ai'

export type UseCase = 'image' | 'text' | 'tts' | 'video'

export type ProviderOptionsByProvider = Record<string, Record<string, unknown>>

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
  responseModalities?: string[]
  useCase: UseCase
}

// Provider-specific block types
export interface OpenAIBlockData extends BaseProviderBlock {
  apiKey: string
  baseURL?: string
  blockType: 'openai'
  organization?: string
  supportedUseCases: UseCase[]
  voices?: any[]
}

export interface AnthropicBlockData extends BaseProviderBlock {
  apiKey: string
  blockType: 'anthropic'
  supportedUseCases: ['text']
}

export interface GoogleBlockData extends BaseProviderBlock {
  apiKey: string
  blockType: 'google'
  supportedUseCases: ('image' | 'text' | 'tts')[]
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
  voices?: any[]
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

// Generic AI Provider interface matching Vercel AI SDK structure
export interface AIProvider {
  (modelId: string, settings?: any): LanguageModel
  chat?: (modelId: string, settings?: any) => LanguageModel
  completion?: (modelId: string, settings?: any) => LanguageModel
  embedding?: (modelId: string, settings?: any) => any
  image?: (modelId: string, settings?: any) => any
  languageModel?: (modelId: string, settings?: any) => LanguageModel
  textEmbedding?: (modelId: string, settings?: any) => any
}

// Provider registry types
export interface ProviderConfig {
  apiKey?: string
  enabled: boolean
  factory: () => AIProvider | any // Provider instance factory
  id: string
  instance?: any // For providers like fal that use singleton
  models: ProviderModel[]
  name: string
}

export type ProviderRegistry = Record<string, ProviderConfig>

export interface UseCaseDefaults {
  model?: string
  provider?: string
  providerOptions?: ProviderOptionsByProvider
  schema?: ProviderOptionsByProvider
  voice?: string
}

export interface AISettingsData {
  defaults: {
    image?: UseCaseDefaults
    text?: UseCaseDefaults
    tts?: UseCaseDefaults
    video?: UseCaseDefaults
  }
  providers: ProviderBlockData[]
}
