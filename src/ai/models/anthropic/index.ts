import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

import type { GenerationConfig } from '../../../types.js'

import { extractPromptAttachments } from '../../../utilities/extractPromptAttachments.js'
import { defaultSystemPrompt } from '../../prompts.js'
import { generateRichText } from './generateRichText.js'

const MODEL_KEY = 'ANTH-C'

export const AnthropicConfig: GenerationConfig = {
  models: [
    {
      id: `${MODEL_KEY}-text`,
      name: 'Anthropic Claude',
      fields: ['text', 'textarea'],
      handler: (prompt: string, options: { extractAttachments: boolean; locale: string; maxTokens: number; model: string; system: string; temperature: number; }) => {
        const streamTextResult = streamText({
          maxOutputTokens: options.maxTokens || 5000,
          model: anthropic(options.model),
          onError: (error) => {
            console.error(`${MODEL_KEY}-text: `, error)
          },
          prompt: options.extractAttachments ? extractPromptAttachments(prompt) : prompt,
          system: options.system || defaultSystemPrompt,
          temperature: options.temperature || 0.7,
        })

        return streamTextResult.toUIMessageStreamResponse();
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
              'claude-opus-4-1',
              'claude-opus-4-0',
              'claude-sonnet-4-0',
              'claude-3-opus-latest',
              'claude-3-5-haiku-latest',
              'claude-3-5-sonnet-latest',
              'claude-3-7-sonnet-latest',
            ],
          },
          {
            type: 'row', fields: [
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

            ]
          },
          {
            name: 'extractAttachments',
            type: 'checkbox',
          }          
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
              'claude-opus-4-1',
              'claude-opus-4-0',
              'claude-sonnet-4-0',
              'claude-3-opus-latest',
              'claude-3-5-haiku-latest',
              'claude-3-5-sonnet-latest',
              'claude-3-7-sonnet-latest',
            ],
          },
          {
            type: 'row', fields: [
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

            ]
          },
          {
            name: 'extractAttachments',
            type: 'checkbox',
          }
        ],
        label: 'Anthropic Claude Settings',
      },
    },
  ],
  provider: 'Anthropic',
}
