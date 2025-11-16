import type { LanguageModel } from 'ai'

import { anthropic as anthropicProvider } from '@ai-sdk/anthropic'
import * as process from 'node:process'

import { openai as openAIProvider } from '../models/openai/openai.js'

export type ProviderKey = 'anthropic' | 'openai'

export const TEXT_MODEL_OPTIONS: Record<ProviderKey, string[]> = {
  anthropic: [
    'claude-opus-4-1',
    'claude-opus-4-0',
    'claude-sonnet-4-0',
    'claude-3-opus-latest',
    'claude-3-5-haiku-latest',
    'claude-3-5-sonnet-latest',
    'claude-3-7-sonnet-latest',
  ],
  openai: [
    'gpt-5',
    'gpt-5-mini',
    'gpt-5-nano',
    'gpt-4.1',
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-4o-mini',
    'gpt-3.5-turbo',
  ],
}

export function availableTextProviders(): ProviderKey[] {
  const providers: ProviderKey[] = []
  if (process.env.OPENAI_API_KEY) {providers.push('openai')}
  if (process.env.ANTHROPIC_API_KEY) {providers.push('anthropic')}
  return providers
}

export function getLanguageModel(provider: ProviderKey, modelName: string): LanguageModel {
  // Validate presence of API keys by provider
  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI is disabled. Set OPENAI_API_KEY to enable.')
  }
  if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('Anthropic is disabled. Set ANTHROPIC_API_KEY to enable.')
  }

  switch (provider) {
    case 'anthropic':
      return anthropicProvider(modelName)
    case 'openai':
      // Use the local OpenAI factory so custom baseURL is respected
      return openAIProvider(modelName)
    default:
      // Exhaustive check for future providers
      throw new Error(`Unsupported provider: ${String(provider)}`)
  }
}
