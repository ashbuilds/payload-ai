import type { Block } from 'payload'

export const googleBlock: Block = {
  slug: 'google',
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enabled',
    },
    {
      name: 'apiKey',
      type: 'text',
      admin: {
        components: {
          Field: '@ai-stack/payloadcms/client#EncryptedTextField',
        },
        description: 'Your Google Generative AI API key. Will be encrypted in the database.',
      },
      label: 'API Key',
      required: true,
    },
    {
      name: 'models',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      defaultValue: [
        {
          id: 'gemini-2.5-flash-image',
          name: 'Gemini 2.5 Flash Image',
          enabled: true,
          generationMethod: 'multimodal-text',
          useCase: 'image',
        },
        {
          id: 'gemini-3-pro-image-preview',
          name: 'Gemini 3 Pro Image Preview',
          enabled: true,
          generationMethod: 'multimodal-text',
          useCase: 'image',
        },
        {
          id: 'gemini-3-pro-image',
          name: 'Gemini 3 Pro Image',
          enabled: true,
          generationMethod: 'multimodal-text',
          useCase: 'image',
        },
      ],
      fields: [
        {
          name: 'id',
          type: 'text',
          label: 'Model ID',
          required: true,
        },
        {
          name: 'name',
          type: 'text',
          label: 'Display Name',
          required: true,
        },
        {
          name: 'useCase',
          type: 'select',
          label: 'Use Case',
          options: [
            { label: 'Text Generation', value: 'text' },
            { label: 'Image Generation', value: 'image' },
          ],
          required: true,
        },
        {
          name: 'generationMethod',
          type: 'select',
          admin: {
            condition: (_, siblingData) => siblingData?.useCase === 'image',
            description: 'How this model generates images',
          },
          defaultValue: 'standard',
          label: 'Generation Method',
          options: [
            { label: 'Standard (experimental_generateImage)', value: 'standard' },
            { label: 'Multimodal Text (generateText)', value: 'multimodal-text' },
          ],
        },
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Enabled',
        },
      ],
      label: 'Available Models',
    },
  ],
  imageURL: '/provider-icons/google-gemini.webp',
  labels: {
    plural: 'Google Providers',
    singular: 'Google Gemini',
  },
}
