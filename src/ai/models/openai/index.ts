import type { SpeechCreateParams } from 'openai/resources/audio/speech'
import type { File } from 'payload'

import type { GenerationConfig } from '../../../types.js'

import { defaultSystemPrompt } from '../../prompts.js'
import { generateFileNameByPrompt } from '../../utils/generateFileNameByPrompt.js'
import { generateObject } from '../generateObject.js'
import { generateImage } from './generateImage.js'
import { generateVoice } from './generateVoice.js'
import { openai } from './openai.js'

const MODEL_KEY = 'Oai'
const MODELS = [
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-4.1',
  'gpt-4o',
  'gpt-4-turbo',
  'gpt-4o-mini',
  'gpt-3.5-turbo',
]

//TODO: Simplify this file by moving the handlers to separate files and remove duplicate code
export const OpenAIConfig: GenerationConfig = {
  models: [
    {
      id: `${MODEL_KEY}-text`,
      name: 'OpenAI GPT Text',
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
            providerOptions: {
              openai: {
                strictJsonSchema: true,
                structuredOutputs: true,
              },
            },
            system: options.system || defaultSystemPrompt,
          },
          openai(options.model),
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
            defaultValue: 'gpt-4o-mini',
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
        label: 'OpenAI GPT Settings',
      },
    },
    {
      id: 'dall-e',
      name: 'OpenAI DALL-E',
      fields: ['upload'],
      handler: async (prompt: string, options) => {
        const imageData = await generateImage(prompt, options)
        return {
          data: {
            alt: imageData.alt,
          },
          file: {
            name: `image_${generateFileNameByPrompt(imageData.alt || prompt)}.jpeg`,
            data: imageData.buffer,
            mimetype: 'image/jpeg',
            size: imageData.buffer.byteLength,
          } as File,
        }
      },
      output: 'image',
      settings: {
        name: 'dalle-e-settings',
        type: 'group',
        admin: {
          condition(data) {
            return data['model-id'] === 'dall-e'
          },
        },
        fields: [
          {
            name: 'version',
            type: 'select',
            defaultValue: 'dall-e-3',
            label: 'Version',
            options: ['dall-e-3', 'dall-e-2'],
          },
          {
            type: 'row',
            fields: [
              {
                name: 'size',
                type: 'select',
                defaultValue: '1024x1024',
                label: 'Size',
                options: ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'],
              },
              {
                name: 'style',
                type: 'select',
                defaultValue: 'natural',
                label: 'Style',
                options: ['vivid', 'natural'],
              },
            ],
          },
          {
            name: 'enable-prompt-optimization',
            type: 'checkbox',
            label: 'Optimize prompt',
          },
        ],
        label: 'OpenAI DALL-E Settings',
      },
    },
    {
      id: 'gpt-image-1',
      name: 'OpenAI GPT Image 1',
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
        name: 'gpt-image-1-settings',
        type: 'group',
        admin: {
          condition(data) {
            return data['model-id'] === 'gpt-image-1'
          },
        },
        fields: [
          {
            name: 'version',
            type: 'select',
            defaultValue: 'gpt-image-1',
            label: 'Version',
            options: ['gpt-image-1'],
          },
          {
            type: 'row',
            fields: [
              {
                name: 'size',
                type: 'select',
                defaultValue: 'auto',
                label: 'Size',
                options: ['1024x1024', '1024x1536', '1536x1024', 'auto'],
              },
              {
                name: 'quality',
                type: 'select',
                defaultValue: 'auto',
                label: 'Quality',
                options: ['low', 'medium', 'high', 'auto'],
              },
            ],
          },
          {
            name: 'output_format',
            type: 'select',
            defaultValue: 'png',
            label: 'Output Format',
            options: ['png', 'jpeg', 'webp'],
          },
          {
            name: 'output_compression',
            type: 'number',
            admin: {
              condition(data) {
                return data.output_format === 'jpeg' || data.output_format === 'webp'
              },
            },
            defaultValue: 100,
            label: 'Output Compression',
            max: 100,
            min: 0,
          },
          {
            name: 'background',
            type: 'select',
            admin: {
              condition(data) {
                return data.output_format === 'png' || data.output_format === 'webp'
              },
            },
            defaultValue: 'white',
            label: 'Background',
            options: ['white', 'transparent'],
          },
          {
            name: 'moderation',
            type: 'select',
            defaultValue: 'auto',
            label: 'Moderation',
            options: ['auto', 'low'],
          },
        ],
        label: 'OpenAI GPT Image 1 Settings',
      },
    },
    {
      id: 'tts',
      name: 'OpenAI Text-to-Speech',
      fields: ['upload'],
      handler: async (text: string, options) => {
        //TODO: change it to open ai text to speech api
        const voiceData = await generateVoice(text, options)
        if (!voiceData || !voiceData.buffer) {
          throw new Error('Voice data missing')
        }
        return {
          data: {
            alt: text,
          },
          file: {
            name: `voice_${generateFileNameByPrompt(text)}.mp3`,
            data: voiceData.buffer,
            mimetype: 'audio/mp3',
            size: voiceData.buffer.byteLength,
          } as File,
        }
      },
      output: 'audio',
      settings: {
        name: `${MODEL_KEY}-tts-settings`,
        type: 'group',
        admin: {
          condition(data) {
            return data['model-id'] === 'tts'
          },
        },
        fields: [
          {
            name: 'voice',
            type: 'select',
            defaultValue: 'alloy',
            label: 'Voice',
            options: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as Array<
              SpeechCreateParams['voice']
            >,
          },
          {
            name: 'model',
            type: 'select',
            defaultValue: 'tts-1',
            label: 'Model',
            options: ['tts-1', 'tts-1-hd'] as Array<SpeechCreateParams['model']>,
          },
          {
            name: 'response_format',
            type: 'select',
            defaultValue: 'mp3',
            label: 'Response Format',
            options: ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'],
          },
          {
            name: 'speed',
            type: 'number',
            defaultValue: 1,
            label: 'Speed',
            max: 4,
            min: 0.25,
          },
        ],
        label: 'OpenAI Text-to-Speech Settings',
      },
    },
    {
      id: `${MODEL_KEY}-object`,
      name: 'OpenAI GPT',
      fields: ['richText'],
      handler: (text: string, options) => {
        return generateObject(
          text,
          {
            ...options,
            providerOptions: {
              openai: {
                strictJsonSchema: true,
                structuredOutputs: true,
              },
            },
            system: options.system || defaultSystemPrompt,
          },
          openai(options.model),
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
            defaultValue: 'gpt-4o',
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
        label: 'OpenAI GPT Settings',
      },
    },
  ],
  provider: 'OpenAI',
}
