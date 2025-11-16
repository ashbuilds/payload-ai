import type { GenerationConfig } from '../../types.js'
import type { ProviderKey } from '../providers/index.js'

import { defaultSystemPrompt } from '../prompts.js'
import { availableTextProviders, getLanguageModel, TEXT_MODEL_OPTIONS } from '../providers/index.js'
import { generateObject } from './generateObject.js'

type TextOptions = {
  extractAttachments?: boolean
  locale?: string
  maxTokens?: number
  model: string
  provider: ProviderKey
  schema?: Record<string, any>
  system?: string
  temperature?: number
}

const ALL_TEXT_MODELS = [...TEXT_MODEL_OPTIONS.openai, ...TEXT_MODEL_OPTIONS.anthropic]

const providerSelect = {
  name: 'provider',
  type: 'select',
  defaultValue: availableTextProviders()[0] || 'openai',
  label: 'Provider',
  options: availableTextProviders().map((p) => p),
}

const modelSelect = {
  name: 'model',
  type: 'select',
  defaultValue: 'gpt-4o',
  label: 'Model',
  // Single static list to avoid complex dynamic filtering in admin UI
  options: ALL_TEXT_MODELS,
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
