import { createAnthropic } from '@ai-sdk/anthropic'

import type { GenerationConfig } from '../../../types.js'

import { defaultSystemPrompt } from '../../prompts.js'
import { createModelInventory } from '../../providers/modelInventory.js'
import { resolveProviderConfig } from '../../providers/resolveProviderConfig.js'
import { generateObject } from '../generateObject.js'
import {
  DEFAULT_ANTHROPIC_TEXT_MODEL,
  getAnthropicTextModelOptions,
  isAnthropicEndpoint,
  resolveAnthropicTextModel,
} from './textModel.js'

const MODEL_KEY = 'ANTH-C'

type AnthropicResolvedProviderConfig = ReturnType<typeof resolveProviderConfig>['anthropic']

export const createAnthropicConfig = (
  providerConfig: AnthropicResolvedProviderConfig = resolveProviderConfig().anthropic,
): GenerationConfig => {
  const inventory = createModelInventory({ ...resolveProviderConfig(), anthropic: providerConfig })
  const capTokens = async (model: string, maxTokens?: number) => {
    const metadata = (await inventory('anthropic')).models.find((item) => item.id === model)
    return metadata?.maxOutputTokens
      ? Math.min(maxTokens || 5000, metadata.maxOutputTokens)
      : maxTokens
  }
  const anthropic = createAnthropic({
    apiKey: providerConfig.apiKey,
    authToken: providerConfig.authToken,
    baseURL: providerConfig.baseURL,
    headers: providerConfig.headers,
  })

  return {
    models: [
      {
        id: `${MODEL_KEY}-text`,
        name: 'Anthropic Claude',
        fields: ['text', 'textarea'],
        handler: async (
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
              maxTokens: await capTokens(
                resolveAnthropicTextModel(options.model, providerConfig.baseURL),
                options.maxTokens,
              ),
              omitTemperature: isAnthropicEndpoint(providerConfig.baseURL),
              system: options.system || defaultSystemPrompt,
            },
            anthropic(resolveAnthropicTextModel(options.model, providerConfig.baseURL)),
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
              type: 'text',
              admin: {
                components: {
                  Field: {
                    clientProps: {
                      fallbackOptions: getAnthropicTextModelOptions(providerConfig.baseURL),
                      provider: 'anthropic',
                    },
                    path: '@ai-stack/payloadcms/fields#ModelField',
                  },
                },
              },
              defaultValue: DEFAULT_ANTHROPIC_TEXT_MODEL,
              label: 'Model',
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
                  admin: { hidden: isAnthropicEndpoint(providerConfig.baseURL) },
                  defaultValue: 0.7,
                  max: 1,
                  min: 0,
                },
              ],
            },
            {
              name: 'extractAttachments',
              type: 'checkbox',
            },
          ],
          label: 'Anthropic Claude Settings',
        },
      },
      {
        id: `${MODEL_KEY}-object`,
        name: 'Anthropic Claude',
        fields: ['richText'],
        handler: async (text: string, options) => {
          return generateObject(
            text,
            {
              ...options,
              maxTokens: await capTokens(
                resolveAnthropicTextModel(options.model, providerConfig.baseURL),
                options.maxTokens,
              ),
              omitTemperature: isAnthropicEndpoint(providerConfig.baseURL),
              system: options.system || defaultSystemPrompt,
            },
            anthropic(resolveAnthropicTextModel(options.model, providerConfig.baseURL)),
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
              type: 'text',
              admin: {
                components: {
                  Field: {
                    clientProps: {
                      fallbackOptions: getAnthropicTextModelOptions(providerConfig.baseURL),
                      provider: 'anthropic',
                    },
                    path: '@ai-stack/payloadcms/fields#ModelField',
                  },
                },
              },
              defaultValue: DEFAULT_ANTHROPIC_TEXT_MODEL,
              label: 'Model',
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
                  admin: { hidden: isAnthropicEndpoint(providerConfig.baseURL) },
                  defaultValue: 0.7,
                  max: 1,
                  min: 0,
                },
              ],
            },
            {
              name: 'extractAttachments',
              type: 'checkbox',
            },
          ],
          label: 'Anthropic Claude Settings',
        },
      },
    ],
    provider: 'Anthropic',
  }
}

export const AnthropicConfig: GenerationConfig = createAnthropicConfig()
