import type { Block } from 'payload'

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
                  max: 2,
                  min: 0,
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
                  max: 1,
                  min: 0,
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
            {
              name: 'imageProviderOptions',
              type: 'group',
              admin: {
                description: 'Default provider options for image generation models.',
              },
              fields: [
                {
                  name: 'quality',
                  type: 'select',
                  dbName: 'compat-image-quality',
                  defaultValue: 'standard',
                  label: 'Quality',
                  options: [
                    { label: 'Standard', value: 'standard' },
                    { label: 'HD', value: 'hd' },
                  ],
                },
                {
                  name: 'style',
                  type: 'select',
                  dbName: 'compat-image-style',
                  defaultValue: 'vivid',
                  label: 'Style',
                  options: [
                    { label: 'Vivid', value: 'vivid' },
                    { label: 'Natural', value: 'natural' },
                  ],
                },
              ],
              label: 'Image Provider Options',
            },
            {
              name: 'ttsProviderOptions',
              type: 'group',
              admin: {
                description: 'Default provider options for TTS models.',
              },
              fields: [
                {
                  name: 'speed',
                  type: 'number',
                  defaultValue: 1.0,
                  label: 'Speed',
                  max: 4,
                  min: 0.25,
                },
                {
                  name: 'response_format',
                  type: 'select',
                  dbName: 'compat-tts-format',
                  defaultValue: 'mp3',
                  label: 'Response Format',
                  options: [
                    { label: 'MP3', value: 'mp3' },
                    { label: 'Opus', value: 'opus' },
                    { label: 'AAC', value: 'aac' },
                    { label: 'FLAC', value: 'flac' },
                    { label: 'WAV', value: 'wav' },
                  ],
                },
              ],
              label: 'TTS Provider Options',
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
  imageURL: '/provider-icons/custom-provider.png',
  labels: {
    plural: 'Custom Providers',
    singular: 'Custom Provider',
  },
}

