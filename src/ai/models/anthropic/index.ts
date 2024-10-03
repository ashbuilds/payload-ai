import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

import type { GenerationConfig } from '../../../types.js'

import { defaultSystemPrompt } from '../../prompts.js'
import { generateRichText } from './generateRichText.js'

const MODEL_KEY = 'ANTH-C'

export const AnthropicConfig: GenerationConfig = {
  models: [
    {
      id: `${MODEL_KEY}-text`,
      name: 'Anthropic Claude',
      fields: ['text', 'textarea'],
      handler: async (
        prompt: string,
        options: { locale: string; model: string; system: string },
      ) => {
        const streamTextResult = await streamText({
          model: anthropic(options.model),
          prompt,
          system: options.system || defaultSystemPrompt,
        })

        return streamTextResult.toDataStreamResponse()
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
            defaultValue: 'claude-3-5-sonnet-20240620',
            label: 'Model',
            options: [
              'claude-3-haiku-20240307',
              'claude-3-sonnet-20240229',
              'claude-3-opus-20240229',
              'claude-3-5-sonnet-20240620',
            ],
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
        return generateRichText(text, options)
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
            defaultValue: 'claude-3-5-sonnet-20240620',
            label: 'Model',
            options: [
              'claude-3-haiku-20240307',
              'claude-3-sonnet-20240229',
              'claude-3-opus-20240229',
              'claude-3-5-sonnet-20240620',
            ],
          },
        ],
        label: 'Anthropic Claude Settings',
      },
    },
  ],
  provider: 'Anthropic',
}
