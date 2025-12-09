import type { Block } from 'payload'

export const anthropicBlock: Block = {
  slug: 'anthropic',
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
                description: 'Your Anthropic API key. Will be encrypted in the database.',
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
                  max: 1.0,
                  min: 0.0,
                },
                {
                  name: 'max_tokens',
                  type: 'number',
                  defaultValue: 4096,
                  label: 'Max Tokens',
                },
                {
                  name: 'top_p',
                  type: 'number',
                  label: 'Top P',
                  max: 1.0,
                  min: 0.0,
                },
                {
                  name: 'top_k',
                  type: 'number',
                  label: 'Top K',
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
                      dbName: 'anthropic-model-useCase',
                      defaultValue: 'text',
                      label: 'Use Case',
                      options: [{ label: 'Text Generation', value: 'text' }],
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
  imageURL: '/provider-icons/anthropic.webp',
  labels: {
    plural: 'Anthropic Providers',
    singular: 'Anthropic',
  },
}

