import type { Block } from 'payload'

export const xaiBlock: Block = {
  slug: 'xai',
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
        description: 'Your xAI API key. Will be encrypted in the database.',
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
        { id: 'grok-4', name: 'Grok 4', enabled: true, useCase: 'text' },
        { id: 'grok-3', name: 'Grok 3', enabled: true, useCase: 'text' },
        { id: 'grok-3-fast', name: 'Grok 3 Fast', enabled: true, useCase: 'text' },
        { id: 'grok-2-1212', name: 'Grok 2', enabled: true, useCase: 'text' },
        { id: 'grok-2-vision-1212', name: 'Grok 2 Vision', enabled: true, useCase: 'image' },
        { id: 'grok-vision-beta', name: 'Grok Vision Beta', enabled: true, useCase: 'image' },
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
    plural: 'xAI Providers',
    singular: 'xAI Grok',
  },
}
