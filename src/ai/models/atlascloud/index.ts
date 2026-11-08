import type { GenerationConfig } from '../../../types.js'
import type { AtlasCloudResolvedProviderConfig } from './atlascloud.js'

import { defaultSystemPrompt } from '../../prompts.js'
import { resolveProviderConfig } from '../../providers/resolveProviderConfig.js'
import { generateObject } from '../generateObject.js'
import { createAtlasCloudProvider } from './atlascloud.js'

const MODEL_KEY = 'ATLASCLOUD'
const MODELS = [
  'deepseek-ai/deepseek-v4-flash',
  'moonshotai/kimi-k3',
  'zai-org/glm-5.2',
  'qwen/qwen3.5-397b-a17b',
]

export const createAtlasCloudConfig = (
  providerConfig: AtlasCloudResolvedProviderConfig = resolveProviderConfig().atlascloud,
): GenerationConfig => {
  const atlascloud = createAtlasCloudProvider(providerConfig)

  return {
    models: [
      {
        id: `${MODEL_KEY}-text`,
        name: 'Atlas Cloud',
        fields: ['text', 'textarea'],
        handler: (
          prompt: string,
          options: {
            extractAttachments?: boolean
            locale?: string
            maxTokens?: number
            model: string
            schema?: Record<string, any>
            system?: string
            temperature?: number
          },
        ) => {
          return generateObject(
            prompt,
            {
              ...options,
              system: options.system || defaultSystemPrompt,
              temperature: options.temperature,
            },
            atlascloud(options.model),
          )
        },
        output: 'text',
        settings: {
          name: `${MODEL_KEY}-text-settings`,
          type: 'group',
          admin: {
            condition(data) {
              return data['model-id'] === `${MODEL_KEY}-text`
            },
          },
          fields: [
            {
              name: 'model',
              type: 'select',
              defaultValue: 'deepseek-ai/deepseek-v4-flash',
              label: 'Model',
              options: MODELS,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'maxTokens',
                  type: 'number',
                  defaultValue: 5000,
                },
                {
                  name: 'temperature',
                  type: 'number',
                  defaultValue: 0.7,
                  max: 2,
                  min: 0,
                },
              ],
            },
            {
              name: 'extractAttachments',
              type: 'checkbox',
            },
          ],
          label: 'Atlas Cloud Settings',
        },
      },
      {
        id: `${MODEL_KEY}-object`,
        name: 'Atlas Cloud',
        fields: ['richText'],
        handler: (text: string, options) => {
          return generateObject(
            text,
            {
              ...options,
              system: options.system || defaultSystemPrompt,
              temperature: options.temperature,
            },
            atlascloud(options.model),
          )
        },
        output: 'text',
        settings: {
          name: `${MODEL_KEY}-object-settings`,
          type: 'group',
          admin: {
            condition(data) {
              return data['model-id'] === `${MODEL_KEY}-object`
            },
          },
          fields: [
            {
              name: 'model',
              type: 'select',
              defaultValue: 'deepseek-ai/deepseek-v4-flash',
              label: 'Model',
              options: MODELS,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'maxTokens',
                  type: 'number',
                  defaultValue: 5000,
                },
                {
                  name: 'temperature',
                  type: 'number',
                  defaultValue: 0.7,
                  max: 2,
                  min: 0,
                },
              ],
            },
            {
              name: 'extractAttachments',
              type: 'checkbox',
            },
          ],
          label: 'Atlas Cloud Settings',
        },
      },
    ],
    provider: 'Atlas Cloud',
  }
}

export const AtlasCloudConfig: GenerationConfig = createAtlasCloudConfig()
