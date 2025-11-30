import type { Block } from 'payload'

export const elevenlabsBlock: Block = {
  slug: 'elevenlabs',
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
        description: 'Your ElevenLabs API key. Will be encrypted in the database.',
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
          id: 'eleven_multilingual_v2',
          name: 'Multilingual V2',
          enabled: true,
          useCase: 'tts',
        },
        { id: 'eleven_turbo_v2_5', name: 'Turbo V2.5', enabled: true, useCase: 'tts' },
        { id: 'eleven_turbo_v2', name: 'Turbo V2', enabled: true, useCase: 'tts' },
        { id: 'eleven_monolingual_v1', name: 'Monolingual V1', enabled: true, useCase: 'tts' },
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
          defaultValue: 'tts',
          label: 'Use Case',
          options: [{ label: 'Text-to-Speech', value: 'tts' }],
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
    plural: 'ElevenLabs Providers',
    singular: 'ElevenLabs',
  },
}
