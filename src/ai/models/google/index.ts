import { google } from '@ai-sdk/google'

import type { GenerationConfig } from '../../../types.js'

import { defaultSystemPrompt } from '../../prompts.js'
import { generateObject } from '../generateObject.js'

const MODEL_KEY = 'GEMINI'
const MODELS = [
  'gemini-3-pro-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
]

export const GoogleConfig: GenerationConfig = {
  models: [
    {
      id: `${MODEL_KEY}-text`,
      name: 'Google Gemini',
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
          google(options.model),
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
            defaultValue: 'gemini-flash-latest',
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
        label: 'Google Gemini Settings',
      },
    },
    {
      id: `${MODEL_KEY}-object`,
      name: 'Google Gemini',
      fields: ['richText'],
      handler: (text: string, options) => {
        return generateObject(
          text,
          {
            ...options,
            system: options.system || defaultSystemPrompt,
          },
          google(options.model),
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
            defaultValue: 'gemini-flash-latest',
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
        label: 'Google Gemini Settings',
      },
    },
  ],
  provider: 'Google',
}

