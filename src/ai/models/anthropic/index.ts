import type { GenerationConfig } from '../../../types.js'

import { generateRichText } from './generateRichText.js'

export const AnthropicConfig: GenerationConfig = {
  models: [
    {
      id: 'anthropic/claude-3.5-sonnet',
      name: 'Anthropic Claude 3.5 Sonnet',
      fields: ['text', 'textarea'],
      output: 'text',
    },
    {
      id: 'anthropic-claude-object',
      name: 'Anthropic Claude',
      fields: ['richText'], //TODO: Use these field to find and replace auto generation functionality in payload config - then we dont need to manually pass the fields - use field admin.components.Label function
      handler: async (text: string, options) => {
        //TODO: change it to open ai text to speech api
        const objectData = await generateRichText(text, options)
        return objectData
      },
      output: 'text',
      settings: {
        name: 'anthropic-claude-object-settings',
        type: 'group',
        admin: {
          condition(data) {
            return data['model-id'] === 'anthropic-claude-object'
          },
        },
        fields: [
          {
            name: 'model',
            type: 'select',
            defaultValue: 'claude-3-5-sonnet-20240620',
            label: 'Model',
            options: ['claude-3-5-sonnet-20240620'],
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
            defaultValue: `[paragraph] - A short introduction to the topic.
            [horizontalrule]
            [list] - A section with headings and a paragraph.
            [horizontalrule]
            [paragraph] - A short conclusion.
            [quote] - A quote from a famous person based on the topic.
            `,
            label: 'Layout',
          },
        ],
        label: 'Anthropic Claude Settings',
      },
    },
  ],
  provider: 'Anthropic',
}
