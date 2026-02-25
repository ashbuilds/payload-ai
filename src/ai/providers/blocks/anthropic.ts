import type { Block } from 'payload'

import { AnthropicIcon } from '../icons.js'

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
                  Field: '@ai-stack/payloadcms/ui/EncryptedTextField/index.js#EncryptedTextField',
                },
                description: 'Your Anthropic API key. Will be encrypted in the database.',
              },
              label: 'API Key',
              required: true,
            },
          ],
          label: 'Setup',
        },

        // 3. Models tab
        {
          fields: [
            {
              name: 'models',
              type: 'array',
              admin: {
                components: {
                  RowLabel: '@ai-stack/payloadcms/ui/ModelRowLabel/index.js#ModelRowLabel',
                },
                initCollapsed: true,
              },
              defaultValue: [
                { id: 'claude-opus-4-1', name: 'Claude Opus 4.1', enabled: true, responseModalities: ['TEXT'], useCase: 'text' },
                { id: 'claude-opus-4-0', name: 'Claude Opus 4.0', enabled: true, responseModalities: ['TEXT'], useCase: 'text' },
                { id: 'claude-sonnet-4-0', name: 'Claude Sonnet 4.0', enabled: true, responseModalities: ['TEXT'], useCase: 'text' },
                {
                  id: 'claude-3-5-sonnet-latest',
                  name: 'Claude 3.5 Sonnet',
                  enabled: true,
                  responseModalities: ['TEXT'],
                  useCase: 'text',
                },
                {
                  id: 'claude-3-5-haiku-latest',
                  name: 'Claude 3.5 Haiku',
                  enabled: true,
                  responseModalities: ['TEXT'],
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
                  name: 'responseModalities',
                  type: 'select',
                  admin: {
                    description: 'Output capabilities of this model',
                    width: '50%',
                  },
                  dbName: 'anthropic-model-modalities',
                  hasMany: true,
                  label: 'Response Modalities',
                  options: [
                    { label: 'Text', value: 'TEXT' },
                    { label: 'Image', value: 'IMAGE' },
                    { label: 'Audio', value: 'AUDIO' },
                  ],
                },
                {
                  name: 'enabled',
                  type: 'checkbox',
                  admin: {
                    width: '50%',
                  },
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
  imageURL: AnthropicIcon,
  labels: {
    plural: 'Anthropic Providers',
    singular: 'Anthropic',
  },
}
