import type { GenerationConfig } from '../../../types.js'

import { defaultSystemPrompt } from '../../prompts.js'
import { generateObject } from '../generateObject.js'
import { minimax } from './minimax.js'

const MODEL_KEY = 'MINIMAX'
const MODELS = ['MiniMax-M2.7', 'MiniMax-M2.7-highspeed', 'MiniMax-M2.5', 'MiniMax-M2.5-highspeed']

/**
 * MiniMax requires temperature in the range (0.0, 1.0].
 * A value of 0 is not accepted, so we clamp to a minimum of 0.001.
 */
function clampTemperature(temperature: number | undefined): number {
  const t = temperature ?? 0.7
  return Math.max(0.001, Math.min(1.0, t))
}

export const MiniMaxConfig: GenerationConfig = {
  models: [
    {
      id: `${MODEL_KEY}-text`,
      name: 'MiniMax',
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
            temperature: clampTemperature(options.temperature),
          },
          minimax(options.model),
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
            defaultValue: 'MiniMax-M2.7',
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
        label: 'MiniMax Settings',
      },
    },
    {
      id: `${MODEL_KEY}-object`,
      name: 'MiniMax',
      fields: ['richText'],
      handler: (text: string, options) => {
        return generateObject(
          text,
          {
            ...options,
            system: options.system || defaultSystemPrompt,
            temperature: clampTemperature(options.temperature),
          },
          minimax(options.model),
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
            defaultValue: 'MiniMax-M2.7',
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
        label: 'MiniMax Settings',
      },
    },
  ],
  provider: 'MiniMax',
}
