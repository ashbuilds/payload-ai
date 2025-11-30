import type { GenerationConfig } from '../../types.js'
import type { ProviderId } from '../providers/index.js'

import { defaultSystemPrompt } from '../prompts.js'
import { allProviderBlocks } from '../providers/blocks/index.js'
import { getLanguageModel } from '../providers/index.js'
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

// Helper to extract models from blocks
const getModelsFromBlocks = (useCase: string) => {
  const models: { label: string; value: string }[] = []

  allProviderBlocks.forEach((block) => {
    const providerId = block.slug
    const modelsField = block.fields.find((f: any) => f.name === 'models')
    const defaultModels =
      modelsField && 'defaultValue' in modelsField ? (modelsField.defaultValue as any[]) : []

    defaultModels.forEach((m) => {
      if (m.useCase === useCase) {
        models.push({
          label: `${block.labels?.singular || providerId} - ${m.name}`,
          value: m.id, // We just use model ID, provider is selected separately
        })
      }
    })
  })

  return models
}

const getTextProviders = () => {
  return allProviderBlocks
    .filter((block) => {
      // Check if this provider has any text models in its default configuration
      const modelsField = block.fields.find((f: any) => f.name === 'models')
      const defaultModels =
        modelsField && 'defaultValue' in modelsField ? (modelsField.defaultValue as any[]) : []
      return defaultModels.some((m) => m.useCase === 'text')
    })
    .map((block) => ({
      label: typeof block.labels?.singular === 'string' ? block.labels.singular : block.slug,
      value: block.slug,
    }))
}

const providerSelect = {
  name: 'provider',
  type: 'select',
  defaultValue: 'openai',
  label: 'Provider',
  options: getTextProviders(),
}

const modelSelect = {
  name: 'model',
  type: 'select',
  defaultValue: 'gpt-4o',
  label: 'Model',
  options: getModelsFromBlocks('text'),
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
      handler: async (prompt: string, options: { req: any } & TextOptions) => {
        const model = await getLanguageModel(options.req.payload, options.provider, options.model)
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
      handler: async (text: string, options: { req: any } & TextOptions) => {
        const model = await getLanguageModel(options.req.payload, options.provider, options.model)
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
