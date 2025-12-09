import type { Block } from 'payload'

export const xaiBlock: Block = {
  slug: 'xai',
  fields: [
    {
      type: 'tabs',
      tabs: [
        // 1. Setup tab
        {
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
          ],
          label: 'Setup',
        },

        // 2. Provider Options tab
        {
          fields: [
            {
              name: 'textProviderOptions',
              type: 'group',
              admin: {
                description: 'Default provider options for text generation models.',
              },
              fields: [
                {
                  name: 'temperature',
                  type: 'number',
                  defaultValue: 1.0,
                  label: 'Default Temperature',
                  max: 2.0,
                  min: 0.0,
                },
                {
                  name: 'max_tokens',
                  type: 'number',
                  label: 'Max Tokens',
                },
                {
                  name: 'top_p',
                  type: 'number',
                  defaultValue: 1.0,
                  label: 'Top P',
                  max: 1.0,
                  min: 0.0,
                },
                {
                  name: 'frequency_penalty',
                  type: 'number',
                  defaultValue: 0,
                  label: 'Frequency Penalty',
                  max: 2,
                  min: -2,
                },
                {
                  name: 'presence_penalty',
                  type: 'number',
                  defaultValue: 0,
                  label: 'Presence Penalty',
                  max: 2,
                  min: -2,
                },
              ],
              label: 'Text Provider Options',
            },
          ],
          label: 'Provider Options',
        },

        // 3. Models tab
        {
          fields: [
            {
              name: 'models',
              type: 'array',
              admin: {
                components: {
                  RowLabel: '@ai-stack/payloadcms/client#ModelRowLabel',
                },
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
                  type: 'row',
                  fields: [
                    {
                      name: 'id',
                      type: 'text',
                      admin: { width: '33%' },
                      label: 'Model ID',
                      required: true,
                    },
                    {
                      name: 'name',
                      type: 'text',
                      admin: { width: '33%' },
                      label: 'Display Name',
                      required: true,
                    },
                    {
                      name: 'useCase',
                      type: 'select',
                      admin: { width: '33%' },
                      label: 'Use Case',
                      options: [
                        { label: 'Text Generation', value: 'text' },
                        { label: 'Image Generation', value: 'image' },
                      ],
                      required: true,
                    },
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
          label: 'Models',
        },
      ],
    },
  ],
  imageURL: '/provider-icons/xai-grok.webp',
  labels: {
    plural: 'xAI Providers',
    singular: 'xAI Grok',
  },
}

