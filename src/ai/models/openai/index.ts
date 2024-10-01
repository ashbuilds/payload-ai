import type { SpeechCreateParams } from 'openai/resources/audio/speech'
import type { File } from 'payload'
import type { ZodSchema } from 'zod'

import { openai } from '@ai-sdk/openai'
import { generateObject, generateText, streamText } from 'ai'

import type { GenerationConfig } from '../../../types.js'

import { defaultSystemPrompt } from '../../prompts.js'
import { LexicalSchemaMap } from '../../schemas/lexical.schema.js'
import { generateFileNameByPrompt } from '../../utils/generateFileNameByPrompt.js'
import { generateImage } from './generateImage.js'
import { generateRichText } from './generateRichText.js'
import { generateVoice } from './generateVoice.js'

const variants = Object.keys(LexicalSchemaMap)
  .flatMap((a) => LexicalSchemaMap[a].variants)
  .filter((v) => !!v)

const MODEL_KEY = 'Oai'

const Lchildren = Object.keys(LexicalSchemaMap)
  .flatMap((a) => LexicalSchemaMap[a].children)
  .filter((v) => !!v)

console.log(' Object.keys(LexicalSchemaMap).flatMap(a=>LexicalSchemaMap[a].variants) : ', variants)
//TODO: Simplify this file by moving the handlers to separate files and remove duplicate code
export const OpenAIConfig: GenerationConfig = {
  models: [
    {
      id: `${MODEL_KEY}-text`,
      name: 'OpenAI GPT Text',
      fields: ['text', 'textarea'],
      handler: async (
        prompt: string,
        options: {
          locale: string
          model: string
          schema: ZodSchema
          stream?: boolean
          system: string
        },
      ) => {
        const params = {
          model: openai(options.model),
          prompt,
          schema: options.schema,
          system: options.system || defaultSystemPrompt,
        }

        if (options.stream) {
          const streamTextResult = await streamText(params)

          return streamTextResult.toDataStreamResponse()
        }

        const generateObjectResult = await generateObject(params)

        return Response.json({ text: generateObjectResult.object })
      },
      output: 'text',
      settings: {
        name: `${MODEL_KEY}-text-settings`,
        type: 'group',
        admin: {
          condition(data) {
            // console.log("model-id : ", data);
            return data['model-id'] === `${MODEL_KEY}-text`
          },
        },
        fields: [
          {
            name: 'model',
            type: 'select',
            defaultValue: 'gpt-4o-mini',
            label: 'Model',
            options: ['gpt-4o', 'gpt-4-turbo', 'gpt-4o-mini', 'gpt-3.5-turbo'],
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
      id: `${MODEL_KEY}-object`,
      name: 'OpenAI GPT',
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
            defaultValue: 'gpt-4o-2024-08-06',
            label: 'Model',
            options: ['gpt-4o', 'gpt-4-turbo', 'gpt-4o-mini', 'gpt-4o-2024-08-06'],
          },
          {
            name: 'system',
            type: 'textarea',
            defaultValue: `INSTRUCTIONS:
You are a highly skilled and professional blog writer,
renowned for crafting engaging and well-organized articles.
When given a title, you meticulously create blogs that are not only
informative and accurate but also captivating and beautifully structured.`,
            label: 'System prompt',
          },
          {
            /**TODO's:
             *  - Layouts can be saved in as an array
             *  - user can add their own layout to collections and use it later for generate specific rich text
             *  - user can select previously added layout
             */
            name: 'layout',
            type: 'array',
            fields: [
              {
                name: 'component',
                type: 'select',
                options: Object.keys(LexicalSchemaMap),
              },
              {
                name: 'variants',
                type: 'group',
                admin: {
                  condition: (_, data) => {
                    if (!data?.component) false

                    return LexicalSchemaMap[data.component]?.variants?.length
                  },
                },
                fields: [
                  {
                    name: 'variants',
                    type: 'select',
                    options: variants,
                  },
                ],
                label: '',
              },
              {
                name: 'children',
                type: 'group',
                admin: {
                  condition: (_, data) => {
                    if (!data?.component) false

                    return LexicalSchemaMap[data.component]?.children?.length
                  },
                },
                fields: [
                  {
                    name: 'contains',
                    type: 'select',
                    // admin: {
                    //   condition: (_, data) => {
                    //     return true
                    //   },
                    // },
                    options: Lchildren,
                  },
                ],
                label: '',
              },
              {
                name: 'description',
                type: 'text',
              },
            ],
            //             defaultValue: `[paragraph] - Write a concise introduction (2-3 sentences) that outlines the main topic.
            // [horizontalrule] - Insert a horizontal rule to separate the introduction from the main content.
            // [list] - Create a list with 3-5 items. Each list item should contain:
            //    a. [heading] - A brief, descriptive heading (up to 5 words)
            //    b. [paragraph] - A short explanation or elaboration (1-2 sentences)
            // [horizontalrule] - Insert another horizontal rule to separate the main content from the conclusion.
            // [paragraph] - Compose a brief conclusion (2-3 sentences) summarizing the key points.
            // [quote] - Include a relevant quote from a famous person, directly related to the topic. Format: "Quote text." - Author Name`,
            label: 'Layout',
          },
        ],
        label: 'OpenAI GPT Settings',
      },
    },
  ],
  provider: 'OpenAI',
}
