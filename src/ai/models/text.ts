import type { GenerationConfig } from '../../types.js'
import type { ProviderId } from '../providers/index.js'

import { defaultSystemPrompt } from '../prompts.js'
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



const providerSelect = {
  name: 'provider',
  type: 'text',
  admin: {
    components: {
      Field: '@ai-stack/payloadcms/client#DynamicProviderSelect',
    },
  },
  defaultValue: 'openai',
  label: 'Provider',
}

const modelSelect = {
  name: 'model',
  type: 'text',
  admin: {
    components: {
      Field: '@ai-stack/payloadcms/client#DynamicModelSelect',
    },
  },
  defaultValue: 'gpt-4o',
  label: 'Model',
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
        console.log("options.req ; ", options.req)
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
