import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import type { SpeechCreateParams } from 'openai/resources/audio/speech'
import type { File } from 'payload'

import type { GenerationConfig } from '../../../types.js'
import { generateFileNameByPrompt } from '../../utils/generateFileNameByPrompt.js'
import { generateImage } from './generateImage.js'
import { generateRichText } from './generateRichText.js'
import { generateVoice } from './generateVoice.js'

export const OpenAIConfig: GenerationConfig = {
  models: [
    {
      id: 'gpt-3.5-turbo',
      name: 'OpenAI GPT-3',
      fields: ['text', 'textarea'],
      handler: async (prompt: string, options: { locale: string }) => {
        const finalPrompt = `Output language code: ${options.locale}
          Prompt: ${prompt}
          Output:
          `

        console.log('finalPrompt: ', finalPrompt)
        const { text } = await generateText({
          model: openai('gpt-3.5-turbo'),
          prompt: finalPrompt,
        })

        console.log('output text: ', text)

        return text
      },
      output: 'text',
    },
    {
      id: 'gpt-4o',
      name: 'OpenAI GPT-4',
      fields: ['text', 'textarea'],
      output: 'text',
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
      id: 'tts',
      name: 'OpenAI Text-to-Speech',
      fields: ['upload'],
      handler: async (text: string, options) => {
        //TODO: change it to open ai text to speech api
        const voiceData = await generateVoice(text, options)
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
        name: 'openai-tts-settings',
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
            options: ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'] as Array<
              SpeechCreateParams['response_format']
            >,
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
      id: 'openai-gpt-object',
      name: 'OpenAI GPT',
      fields: ['richText'], //TODO: Use these field to find and replace auto generation functionality in payload config - then we dont need to manually pass the fields - use field admin.components.Label function
      handler: async (text: string, options) => {
        //TODO: change it to open ai text to speech api
        const objectData = await generateRichText(text, options)
        return objectData
      },
      output: 'text',
      settings: {
        name: 'openai-gpt-object-settings',
        type: 'group',
        admin: {
          condition(data) {
            return data['model-id'] === 'openai-gpt-object'
          },
        },
        fields: [
          {
            name: 'model',
            type: 'select',
            defaultValue: 'gpt-4o',
            label: 'Model',
            options: ['gpt-4o', 'gpt-4-turbo'],
          },
          {
            name: 'system',
            type: 'textarea',
            label: 'System prompt',
            defaultValue: `INSTRUCTIONS:
      You are a highly skilled and professional blog writer,
      renowned for crafting engaging and well-organized articles.
      When given a title, you meticulously create blogs that are not only
      informative and accurate but also captivating and beautifully structured.`,
          },
          {
            /**TODO's:
             *  - Layouts can be saved in as an array
             *  - user can add their own layout to collections and use it later for generate specific rich text
             *  - user can select previously added layout
             */
            name: 'layout',
            type: 'textarea',
            label: 'Layout',
            defaultValue: `[paragraph] - A short introduction to the topic.
            [horizontalrule]
            [list] - A section with headings and a paragraph.
            [horizontalrule]
            [paragraph] - A short conclusion.
            [quote] - A quote from a famous person based on the topic.
            `,
          },
        ],
        label: 'OpenAI GPT Settings',
      },
    },
  ],
  provider: 'OpenAI',
}
