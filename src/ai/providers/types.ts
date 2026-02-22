import type { LanguageModel } from 'ai'

export type UseCase = 'image' | 'text' | 'tts' | 'video'

export interface ProviderOption {
  key: string
  type: 'boolean' | 'number' | 'options' | 'text'
  valueBoolean?: boolean
  valueNumber?: number
  valueOptions?: { label?: string; value: string }[]
  valueText?: string
}

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
  imageProviderOptions?: Record<string, any>
  organization?: string
  supportedUseCases: UseCase[]
  textProviderOptions?: Record<string, any>
  ttsProviderOptions?: Record<string, any>
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
  imageProviderOptions?: Record<string, any>
  supportedUseCases: ('image' | 'text' | 'tts')[]
  textProviderOptions?: Record<string, any>
  ttsProviderOptions?: Record<string, any>
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
  ttsProviderOptions?: Record<string, any>
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

export interface AISettingsData {
  defaults: {
    image?: { model: string; provider: string; providerOptions?: ProviderOption[] }
    text?: { model: string; provider: string; providerOptions?: ProviderOption[] }
    tts?: { model: string; provider: string; providerOptions?: ProviderOption[]; voice?: string }
    video?: { model: string; provider: string; providerOptions?: ProviderOption[] }
  }
  providers: ProviderBlockData[]
}
