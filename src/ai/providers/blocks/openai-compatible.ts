import type { Block } from 'payload'

import { CustomProviderIcon } from '../icons.js'

export const openaiCompatibleBlock: Block = {
  slug: 'openai-compatible',
  fields: [
    {
      type: 'tabs',
      tabs: [
        // 1. Setup tab
        {
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
                  RowLabel: '@ai-stack/payloadcms/client#ModelRowLabel',
                },
                initCollapsed: true,
              },
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
                      dbName: 'compat-model-useCase',
                      label: 'Use Case',
                      options: [
                        { label: 'Text Generation', value: 'text' },
                        { label: 'Image Generation', value: 'image' },
                        { label: 'Video Generation', value: 'video' },
                        { label: 'Text-to-Speech', value: 'tts' },
                      ],
                      required: true,
                    },
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
                {
                  name: 'responseModalities',
                  type: 'select',
                  admin: {
                    description: 'Output capabilities of this model',
                    width: '50%',
                  },
                  dbName: 'compat-model-modalities',
                  hasMany: true,
                  label: 'Response Modalities',
                  options: [
                    { label: 'Text', value: 'TEXT' },
                    { label: 'Image', value: 'IMAGE' },
                    { label: 'Audio', value: 'AUDIO' },
                  ],
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
  imageURL: CustomProviderIcon,
  labels: {
    plural: 'Custom Providers',
    singular: 'Custom Provider',
  },
}
