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
      handler: (prompt: string, options: { locale: string; model: string; system: string }) => {
        const streamTextResult = streamText({
          model: anthropic(options.model),
          onError: (ee) => {
            console.log('streamText : error : ', ee)
          },
          onFinish: (stepResult) => {
            console.log('streamText : finish : ', stepResult)
          },
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
            defaultValue: 'claude-3-5-sonnet-latest',
            label: 'Model',
            options: [
              'claude-3-opus-latest',
              'claude-3-5-haiku-latest',
              'claude-3-5-sonnet-latest',
              'claude-3-7-sonnet-latest'
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
            defaultValue: 'claude-3-5-sonnet-latest',
            label: 'Model',
            options: [
              'claude-3-opus-latest',
              'claude-3-5-haiku-latest',
              'claude-3-5-sonnet-latest',
              'claude-3-7-sonnet-latest'
            ],
          },
        ],
        label: 'Anthropic Claude Settings',
      },
    },
  ],
  provider: 'Anthropic',
}
