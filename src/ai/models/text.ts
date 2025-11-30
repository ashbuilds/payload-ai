import type { GenerationConfig } from '../../types.js'
import type { ProviderId } from '../providers/index.js'

import { defaultSystemPrompt } from '../prompts.js'
import {
  getEnabledProviders,
  getLanguageModel,
  getModelsForUseCase,
  providerRegistry,
} from '../providers/index.js'
import { generateObject } from './generateObject.js'

type TextOptions = {
  extractAttachments?: boolean
  locale?: string
  maxTokens?: number
  model: string
  provider: ProviderId
  schema?: Record<string, any>
  system?: string
  temperature?: number
}

// Get all text models across all enabled providers
const getAllTextModels = () => {
  const models = getModelsForUseCase('text')
  return models.map((m) => `${m.provider}/${m.model}`)
}

const getTextProviders = () => {
  return getEnabledProviders().filter((id) => {
    const models = providerRegistry[id].models.text
    return models && models.length > 0
  })
}

const providerSelect = {
  name: 'provider',
  type: 'select',
  defaultValue: getTextProviders()[0] || 'openai',
  label: 'Provider',
  options: getTextProviders().map((p) => ({ label: providerRegistry[p].name, value: p })),
}

const modelSelect = {
  name: 'model',
  type: 'select',
  defaultValue: 'gpt-4o',
  label: 'Model',
  // Return all text models from all enabled providers
  options: getAllTextModels(),
}

const commonParamsRow = {
  type: 'row' as const,
  fields: [
    {
      name: 'maxTokens',
      type: 'number' as const,
      defaultValue: 5000,
    },
    {
      name: 'temperature',
      type: 'number' as const,
      defaultValue: 0.7,
      max: 1,
      min: 0,
    },
  ],
}

export const TextConfig: GenerationConfig = {
  models: [
    {
      id: 'text',
      name: 'Text (AI SDK)',
      fields: ['text', 'textarea'],
      handler: (prompt: string, options: TextOptions) => {
        const model = getLanguageModel(options.provider, options.model)
        return generateObject(
          prompt,
          {
            ...options,
            // Keep default system for basic text usage
            system: options.system || defaultSystemPrompt,
            // OpenAI-specific structured output options are still passed through generateObject
            providerOptions:
              options.provider === 'openai'
                ? { openai: { strictJsonSchema: true, structuredOutputs: true } }
                : undefined,
          },
          model,
        )
      },
      output: 'text',
      settings: {
        name: 'text-settings',
        type: 'group',
        admin: {
          condition(data: any) {
            return data['model-id'] === 'text'
          },
        },
        fields: [
          providerSelect,
          modelSelect,
          commonParamsRow,
          {
            name: 'extractAttachments',
            type: 'checkbox',
          },
        ],
        label: 'Text Settings',
      } as any,
    },
    {
      id: 'richtext',
      name: 'Rich Text (AI SDK)',
      fields: ['richText'],
      handler: (text: string, options: TextOptions) => {
        const model = getLanguageModel(options.provider, options.model)
        return generateObject(
          text,
          {
            ...options,
            // For rich text we still allow caller to pass system; endpoints build a specialized one
            providerOptions:
              options.provider === 'openai'
                ? { openai: { strictJsonSchema: true, structuredOutputs: true } }
                : undefined,
          },
          model,
        )
      },
      output: 'text',
      settings: {
        name: 'richtext-settings',
        type: 'group',
        admin: {
          condition(data: any) {
            return data['model-id'] === 'richtext'
          },
        },
        fields: [
          providerSelect,
          modelSelect,
          commonParamsRow,
          {
            name: 'extractAttachments',
            type: 'checkbox',
          },
        ],
        label: 'Rich Text Settings',
      } as any,
    },
  ],
  provider: 'AI SDK',
}
