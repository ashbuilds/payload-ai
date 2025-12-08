import type { Block } from 'payload'


export const falBlock: Block = {
  slug: 'fal',
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
        description: 'Your Fal API key. Will be encrypted in the database.',
      },
      label: 'API Key',
      required: true,
    },
    {
      name: 'webhookSecret',
      type: 'text',
      admin: {
        description: 'Secret for webhook verification (optional)',
      },
      label: 'Webhook Secret',
    },
    {
      name: 'models',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      defaultValue: [
        { id: 'fal-ai/flux-pro', name: 'Flux Pro', enabled: true, useCase: 'image' },
        { id: 'fal-ai/flux/dev', name: 'Flux Dev', enabled: true, useCase: 'image' },
        { id: 'fal-ai/flux/schnell', name: 'Flux Schnell', enabled: true, useCase: 'image' },
        { id: 'fal-ai/flux-realism', name: 'Flux Realism', enabled: true, useCase: 'image' },
        { id: 'fal-ai/minimax-video', name: 'Minimax Video', enabled: true, useCase: 'video' },
        { id: 'fal-ai/hunyuan-video', name: 'Hunyuan Video', enabled: true, useCase: 'video' },
        {
          id: 'fal-ai/luma-dream-machine',
          name: 'Luma Dream Machine',
          enabled: true,
          useCase: 'video',
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
            { label: 'Image Generation', value: 'image' },
            { label: 'Video Generation', value: 'video' },
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
  imageURL: '/provider-icons/fai-ai.webp',
  labels: {
    plural: 'Fal Providers',
    singular: 'Fal AI',
  },
}
