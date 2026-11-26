import { createAnthropic } from '@ai-sdk/anthropic'

import type { GenerationConfig } from '../../../types.js'

import { defaultSystemPrompt } from '../../prompts.js'
import { resolveProviderConfig } from '../../providers/resolveProviderConfig.js'
import { generateObject } from '../generateObject.js'
import {
  DEFAULT_ANTHROPIC_TEXT_MODEL,
  getAnthropicTextModelOptions,
  resolveAnthropicTextModel,
} from './textModel.js'

const MODEL_KEY = 'ANTH-C'

type AnthropicResolvedProviderConfig = ReturnType<typeof resolveProviderConfig>['anthropic']

export const createAnthropicConfig = (
  providerConfig: AnthropicResolvedProviderConfig = resolveProviderConfig().anthropic,
): GenerationConfig => {
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
              type: 'select',
              defaultValue: DEFAULT_ANTHROPIC_TEXT_MODEL,
              label: 'Model',
              options: getAnthropicTextModelOptions(providerConfig.baseURL),
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
        handler: (text: string, options) => {
          return generateObject(
            text,
            {
              ...options,
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
              type: 'select',
              defaultValue: DEFAULT_ANTHROPIC_TEXT_MODEL,
              label: 'Model',
              options: getAnthropicTextModelOptions(providerConfig.baseURL),
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
