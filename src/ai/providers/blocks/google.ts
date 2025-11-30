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
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', enabled: true, useCase: 'text' },
        { id: 'gemini-exp-1206', name: 'Gemini Exp 1206', enabled: true, useCase: 'text' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', enabled: true, useCase: 'text' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', enabled: true, useCase: 'text' },
        {
          id: 'imagen-3.0-generate-001',
          name: 'Imagen 3.0',
          enabled: true,
          useCase: 'image',
        },
        {
          id: 'imagen-3.0-fast-generate-001',
          name: 'Imagen 3.0 Fast',
          enabled: true,
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
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Enabled',
        },
      ],
      label: 'Available Models',
    },
  ],
  labels: {
    plural: 'Google Providers',
    singular: 'Google Gemini',
  },
}
