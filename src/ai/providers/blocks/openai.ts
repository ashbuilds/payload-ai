import type { Block } from 'payload'

export const openaiBlock: Block = {
  slug: 'openai',
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Enabled',
        },
      ],
    },
    {
      name: 'apiKey',
      type: 'text',
      admin: {
        components: {
          Field: '@ai-stack/payloadcms/client#EncryptedTextField',
        },
        description: 'Your OpenAI API key. Will be encrypted in the database.',
      },
      label: 'API Key',
      required: true,
    },
    {
      name: 'baseURL',
      type: 'text',
      admin: {
        description: 'API endpoint (change for custom deployments)',
      },
      defaultValue: 'https://api.openai.com/v1',
      label: 'Base URL',
    },
    {
      name: 'organization',
      type: 'text',
      admin: {
        description: 'Optional OpenAI organization ID',
      },
      label: 'Organization ID',
    },
    {
      name: 'models',
      type: 'array',
      admin: {
        description: 'Models offered by this provider',
        initCollapsed: true,
      },
      defaultValue: [
        { id: 'gpt-4o', name: 'GPT-4o', enabled: true, useCase: 'text' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', enabled: true, useCase: 'text' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', enabled: true, useCase: 'text' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', enabled: true, useCase: 'text' },
        { id: 'dall-e-3', name: 'DALL-E 3', enabled: true, useCase: 'image' },
        { id: 'dall-e-2', name: 'DALL-E 2', enabled: true, useCase: 'image' },
        { id: 'tts-1', name: 'TTS 1', enabled: true, useCase: 'tts' },
        { id: 'tts-1-hd', name: 'TTS 1 HD', enabled: true, useCase: 'tts' },
      ],
      fields: [
        {
          name: 'id',
          type: 'text',
          admin: {
            description: 'API model identifier (e.g., gpt-4o)',
          },
          label: 'Model ID',
          required: true,
        },
        {
          name: 'name',
          type: 'text',
          admin: {
            description: 'User-friendly name (e.g., GPT-4o)',
          },
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
  imageURL: '/provider-icons/openai.webp',
  labels: {
    plural: 'OpenAI Providers',
    singular: 'OpenAI',
  },
}
