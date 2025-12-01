import type { File } from 'payload'
import { google } from '@ai-sdk/google'

import type { GenerationConfig } from '../../../types.js'

import { defaultSystemPrompt } from '../../prompts.js'
import { generateFileNameByPrompt } from '../../utils/generateFileNameByPrompt.js'
import { generateObject } from '../generateObject.js'
import { generateImage } from './generateImage.js'

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

const IMAGEN_MODELS = [
  'imagen-4.0-fast-generate-001',
  'imagen-4.0-generate-001',
  'imagen-4.0-ultra-generate-001',
  'imagen-3.0-generate-002',
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
    {
      id: 'imagen',
      name: 'Google Imagen',
      fields: ['upload'],
      handler: async (prompt: string, options) => {
        const imageData = await generateImage(prompt, options)
        return {
          data: {
            alt: imageData.alt,
          },
          file: {
            name: `image_${generateFileNameByPrompt(imageData.alt || prompt)}.png`,
            data: imageData.buffer,
            mimetype: 'image/png',
            size: imageData.buffer.byteLength,
          } as File,
        }
      },
      output: 'image',
      settings: {
        name: 'imagen-settings',
        type: 'group',
        admin: {
          condition(data) {
            return data['model-id'] === 'imagen'
          },
        },
        fields: [
          {
            name: 'model',
            type: 'select',
            defaultValue: 'imagen-4.0-fast-generate-001',
            label: 'Model',
            options: IMAGEN_MODELS,
          },
          {
            type: 'row',
            fields: [
              {
                name: 'aspectRatio',
                type: 'select',
                defaultValue: '1:1',
                label: 'Aspect Ratio',
                options: ['1:1', '3:4', '4:3', '9:16', '16:9'],
              },
              {
                name: 'numberOfImages',
                type: 'number',
                defaultValue: 1,
                label: 'Number of Images',
                max: 4,
                min: 1,
              },
            ],
          },
          {
            name: 'outputMimeType',
            type: 'select',
            defaultValue: 'image/png',
            label: 'Output Format',
            options: ['image/png', 'image/jpeg'],
          },
        ],
        label: 'Google Imagen Settings',
      },
    },
  ],
  provider: 'Google',
}
