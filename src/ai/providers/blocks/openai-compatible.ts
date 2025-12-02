import type { Block } from 'payload'

export const openaiCompatibleBlock: Block = {
  slug: 'openai-compatible',
  fields: [
    {
      name: 'providerName',
      type: 'text',
      admin: {
        description: 'Display name for this custom provider (e.g., "Ollama", "Together AI")',
      },
      label: 'Provider Name',
      required: true,
    },
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
        description: 'API key for this provider (if required)',
      },
      label: 'API Key',
      required: true,
    },
    {
      name: 'baseURL',
      type: 'text',
      admin: {
        description: 'OpenAI-compatible API endpoint (e.g., http://localhost:11434/v1)',
      },
      label: 'API Base URL',
      required: true,
    },
    {
      name: 'models',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
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
            { label: 'Video Generation', value: 'video' },
            { label: 'Text-to-Speech', value: 'tts' },
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
  imageURL: '/provider-icons/custom-provider.png',
  labels: {
    plural: 'Custom Providers',
    singular: 'Custom Provider',
  },
}
