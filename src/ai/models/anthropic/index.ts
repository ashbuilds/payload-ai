import { anthropic } from '@ai-sdk/anthropic'
import { generateText, streamText } from 'ai'

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
        options: { locale: string; model: string; stream?: boolean; system: string },
      ) => {
        const params = {
          model: anthropic(options.model),
          prompt,
          system: options.system || defaultSystemPrompt,
        }

        if (options.stream) {
          const streamTextResult = await streamText(params)
          return streamTextResult.toDataStreamResponse()
        }

        const generateTextResult = await generateText(params)
        return generateTextResult.text
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
            name: 'layout',
            type: 'textarea',
            defaultValue: `[paragraph] - Write a concise introduction (2-3 sentences) that outlines the main topic.
[horizontalrule] - Insert a horizontal rule to separate the introduction from the main content.
[list] - Create a list with 3-5 items. Each list item should contain:
   a. [heading] - A brief, descriptive heading (up to 5 words)
   b. [paragraph] - A short explanation or elaboration (1-2 sentences)
[horizontalrule] - Insert another horizontal rule to separate the main content from the conclusion.
[paragraph] - Compose a brief conclusion (2-3 sentences) summarizing the key points.
[quote] - Include a relevant quote from a famous person, directly related to the topic. Format: "Quote text." - Author Name`,
            label: 'Layout',
          },
        ],
        label: 'Anthropic Claude Settings',
      },
    },
  ],
  provider: 'Anthropic',
}
