import type { Block } from 'payload'


import { OpenAIIcon } from '../icons.js'

export const openaiBlock: Block = {
  slug: 'openai',
  custom: {
    providerOptionsSchemas: {
      image: {
        fields: ['quality', 'style'],
      },
      text: {
        fields: [
          'temperature',
          'max_tokens',
          'top_p',
          'frequency_penalty',
          'presence_penalty',
          'seed',
          'logitBias',
        ],
      },
      tts: {
        fields: ['speed', 'response_format', 'instructions'],
      },
    },
  },
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
                description:
                  'Optional. If empty, @ai-sdk/openai will use the OPENAI_API_KEY environment variable.',
              },
              label: 'API Key',
              required: false,
            },
          ],
          label: 'Setup',
        },

        // 2. Connection tab
        {
          fields: [
            {
              type: 'collapsible',
              admin: {
                initCollapsed: false,
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'baseURL',
                      type: 'text',
                      admin: {
                        description:
                          'Optional. Override default API endpoint (defaults to https://api.openai.com/v1).',
                      },
                      defaultValue: 'https://api.openai.com/v1',
                      label: 'Base URL',
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'organization',
                      type: 'text',
                      admin: {
                        description:
                          'Optional. OpenAI organization ID for billing and access control.',
                      },
                      label: 'Organization ID',
                    },
                    {
                      name: 'project',
                      type: 'text',
                      admin: {
                        description: 'Optional. OpenAI project ID for organization-level access.',
                      },
                      label: 'Project ID',
                    },
                  ],
                },
                {
                  name: 'headers',
                  type: 'array',
                  admin: {
                    description:
                      'Optional. Extra headers to send with every request, for example routing through a proxy.',
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'key',
                          type: 'text',
                          admin: {
                            width: '50%',
                          },
                          label: 'Header Name',
                          required: true,
                        },
                        {
                          name: 'value',
                          type: 'text',
                          admin: {
                            width: '50%',
                          },
                          label: 'Header Value',
                          required: true,
                        },
                      ],
                    },
                  ],
                  label: 'Custom Headers',
                },
              ],
              label: 'API & Network Settings',
            },
          ],
          label: 'Connection',
        },

        // 3. Voices tab (NEW)
        {
          fields: [
            {
              name: 'voices',
              type: 'array',
              admin: {
                description: 'Available voices for Text-to-Speech models. You can add custom voices here.',
                initCollapsed: false,
              },
              defaultValue: [
                { id: 'alloy', name: 'Alloy', enabled: true },
                { id: 'echo', name: 'Echo', enabled: true },
                { id: 'fable', name: 'Fable', enabled: true },
                { id: 'onyx', name: 'Onyx', enabled: true },
                { id: 'nova', name: 'Nova', enabled: true },
                { id: 'shimmer', name: 'Shimmer', enabled: true },
              ],
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'id',
                      type: 'text',
                      admin: {
                        description: 'Voice ID as used by OpenAI API',
                        width: '40%',
                      },
                      label: 'Voice ID',
                      required: true,
                    },
                    {
                      name: 'name',
                      type: 'text',
                      admin: {
                        width: '40%',
                      },
                      label: 'Display Name',
                      required: true,
                    },
                    {
                      name: 'enabled',
                      type: 'checkbox',
                      admin: {
                        width: '20%',
                      },
                      defaultValue: true,
                      label: 'Enabled',
                    },
                  ],
                },
              ],
              label: 'Available Voices',
            },
          ],
          label: 'Voices',
        },

        // 4. Provider Options (NEW - One group per use case)
        {
          fields: [
            // TTS Provider Options
            {
              name: 'ttsProviderOptions',
              type: 'group',
              admin: {
                description: 'Default provider options for TTS models. Users can override these per field.',
              },
              fields: [
                {
                  name: 'speed',
                  type: 'number',
                  defaultValue: 1.0,
                  label: 'Default Speed',
                  max: 4,
                  min: 0.25,
                },
                {
                  name: 'response_format',
                  type: 'select',
                  dbName: "openai-tts-response_format",
                  defaultValue: 'mp3',
                  label: 'Default Response Format',
                  options: [
                    { label: 'MP3', value: 'mp3' },
                    { label: 'Opus', value: 'opus' },
                    { label: 'AAC', value: 'aac' },
                    { label: 'FLAC', value: 'flac' },
                    { label: 'WAV', value: 'wav' },
                    { label: 'PCM', value: 'pcm' },
                  ],
                },
                {
                  name: 'instructions',
                  type: 'textarea',
                  admin: {
                    placeholder: 'Optional default voice instructions',
                  },
                  label: 'Default Instructions',
                },
              ],
              label: 'TTS Provider Options',
            },

            // Image Provider Options
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
                  dbName: 'openai-image-quality',
                  defaultValue: 'standard',
                  label: 'Default Quality',
                  options: [
                    { label: 'Standard', value: 'standard' },
                    { label: 'HD', value: 'hd' },
                  ],
                },
                {
                  name: 'style',
                  type: 'select',
                  dbName: 'openai-image-style',
                  defaultValue: 'vivid',
                  label: 'Default Style',
                  options: [
                    { label: 'Vivid', value: 'vivid' },
                    { label: 'Natural', value: 'natural' },
                  ],
                },
              ],
              label: 'Image Provider Options',
            },

            // Text Provider Options
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
                  label: 'Default Max Tokens',
                },
                {
                  name: 'top_p',
                  type: 'number',
                  defaultValue: 1.0,
                  label: 'Default Top P',
                  max: 1,
                  min: 0,
                },
                {
                  name: 'frequency_penalty',
                  type: 'number',
                  defaultValue: 0,
                  label: 'Default Frequency Penalty',
                  max: 2,
                  min: -2,
                },
                {
                  name: 'presence_penalty',
                  type: 'number',
                  defaultValue: 0,
                  label: 'Default Presence Penalty',
                  max: 2,
                  min: -2,
                },
                {
                  name: 'seed',
                  type: 'number',
                  label: 'Default Seed',
                },
                {
                  name: 'logitBias',
                  type: 'json',
                  admin: {
                    description: 'Modify likelihood of tokens (JSON object mapping token IDs to bias).',
                  },
                  label: 'Default Logit Bias',
                },
              ],
              label: 'Text Provider Options',
            },
          ],
          label: 'Provider Options',
        },

        // 5. Models (SIMPLIFIED - no per-model settings)
        {
          fields: [
            {
              name: 'models',
              type: 'array',
              admin: {
                components: {
                  RowLabel: '@ai-stack/payloadcms/client#ModelRowLabel',
                },
                description: 'Keep this list short. Enable only the models you actually use.',
                initCollapsed: true,
              },
              label: 'Available Models',
              labels: {
                plural: 'Models',
                singular: 'Model',
              },
              // Curated models for content creation platforms
              defaultValue: [
                // ===== Text Generation =====
                {
                  id: 'gpt-5',
                  name: 'GPT-5 (Latest Flagship)',
                  enabled: true,
                  responseModalities: ['TEXT'],
                  useCase: 'text',
                },
                {
                  id: 'gpt-5-mini',
                  name: 'GPT-5 Mini (Fast & Efficient)',
                  enabled: true,
                  responseModalities: ['TEXT'],
                  useCase: 'text',
                },
                {
                  id: 'chatgpt-4o-latest',
                  name: 'ChatGPT-4o (Always Updated)',
                  enabled: true,
                  responseModalities: ['TEXT'],
                  useCase: 'text',
                },
                {
                  id: 'gpt-4o',
                  name: 'GPT-4o (Multimodal)',
                  enabled: true,
                  responseModalities: ['TEXT'],
                  useCase: 'text',
                },
                {
                  id: 'gpt-4o-mini',
                  name: 'GPT-4o Mini (Best Value)',
                  enabled: true,
                  responseModalities: ['TEXT'],
                  useCase: 'text',
                },
                {
                  id: 'gpt-4-turbo',
                  name: 'GPT-4 Turbo',
                  enabled: true,
                  responseModalities: ['TEXT'],
                  useCase: 'text',
                },

                // ===== Image Generation =====
                {
                  id: 'gpt-image-1',
                  name: 'GPT Image 1 (Latest)',
                  enabled: true,
                  useCase: 'image',
                },
                {
                  id: 'dall-e-3',
                  name: 'DALL-E 3',
                  enabled: true,
                  useCase: 'image',
                },

                // ===== Audio =====
                {
                  id: 'tts-1-hd',
                  name: 'TTS HD (Text-to-Speech)',
                  enabled: true,
                  responseModalities: ['AUDIO'],
                  useCase: 'tts',
                },
              ],
              fields: [
                // Basic model info
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'id',
                      type: 'text',
                      admin: {
                        description:
                          'Exact model id as used with @ai-sdk/openai, for example gpt-4o.',
                        width: '33%',
                      },
                      label: 'Model ID',
                      required: true,
                    },
                    {
                      name: 'name',
                      type: 'text',
                      admin: {
                        width: '33%',
                      },
                      label: 'Display Name',
                      required: true,
                    },
                    {
                      name: 'useCase',
                      type: 'select',
                      admin: {
                        width: '33%',
                      },
                      dbName: 'openai-model-useCase',
                      defaultValue: 'text',
                      label: 'Use Case',
                      options: [
                        { label: 'Text', value: 'text' },
                        { label: 'Image Generation', value: 'image' },
                        { label: 'Text-to-Speech', value: 'tts' },
                        { label: 'Embeddings', value: 'embedding' },
                      ],
                    },
                  ],
                },
                // Response modalities and enabled checkbox
                {
                  name: 'responseModalities',
                  type: 'select',
                  admin: {
                    description: 'Output capabilities of this model',
                    width: '50%',
                  },
                  dbName: 'openai-model-modalities',
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
            },
          ],
          label: 'Models',
        },
      ],
    },
  ],
  imageURL: OpenAIIcon,
  labels: {
    plural: 'OpenAI Providers',
    singular: 'OpenAI',
  },
}
