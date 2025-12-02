import type { Block } from 'payload'

export const anthropicBlock: Block = {
  slug: 'anthropic',
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
        description: 'Your Anthropic API key. Will be encrypted in the database.',
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
        { id: 'claude-opus-4-1', name: 'Claude Opus 4.1', enabled: true, useCase: 'text' },
        { id: 'claude-opus-4-0', name: 'Claude Opus 4.0', enabled: true, useCase: 'text' },
        { id: 'claude-sonnet-4-0', name: 'Claude Sonnet 4.0', enabled: true, useCase: 'text' },
        {
          id: 'claude-3-5-sonnet-latest',
          name: 'Claude 3.5 Sonnet',
          enabled: true,
          useCase: 'text',
        },
        {
          id: 'claude-3-5-haiku-latest',
          name: 'Claude 3.5 Haiku',
          enabled: true,
          useCase: 'text',
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
          defaultValue: 'text',
          label: 'Use Case',
          options: [{ label: 'Text Generation', value: 'text' }],
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
  imageURL: '/provider-icons/anthropic.webp',
  labels: {
    plural: 'Anthropic Providers',
    singular: 'Anthropic',
  },
}
