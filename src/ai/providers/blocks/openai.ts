import type { Block } from 'payload'

export const openaiBlock: Block = {
  slug: 'openai',
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
                description: 'Keep this list short. Enable only the models you actually use.',
                initCollapsed: false,
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
                  maxTokens: 16384,
                  temperature: 1.0,
                  topP: 1.0,
                  useCase: 'text',
                },
                {
                  id: 'gpt-5-mini',
                  name: 'GPT-5 Mini (Fast & Efficient)',
                  enabled: true,
                  maxTokens: 16384,
                  temperature: 1.0,
                  topP: 1.0,
                  useCase: 'text',
                },
                {
                  id: 'chatgpt-4o-latest',
                  name: 'ChatGPT-4o (Always Updated)',
                  enabled: true,
                  maxTokens: 16384,
                  temperature: 1.0,
                  topP: 1.0,
                  useCase: 'text',
                },
                {
                  id: 'gpt-4o',
                  name: 'GPT-4o (Multimodal)',
                  enabled: true,
                  maxTokens: 16384,
                  temperature: 1.0,
                  topP: 1.0,
                  useCase: 'text',
                },
                {
                  id: 'gpt-4o-mini',
                  name: 'GPT-4o Mini (Best Value)',
                  enabled: true,
                  maxTokens: 16384,
                  temperature: 1.0,
                  topP: 1.0,
                  useCase: 'text',
                },
                {
                  id: 'gpt-4-turbo',
                  name: 'GPT-4 Turbo',
                  enabled: true,
                  maxTokens: 4096,
                  temperature: 1.0,
                  topP: 1.0,
                  useCase: 'text',
                },

                // ===== Image Generation =====
                {
                  id: 'gpt-image-1',
                  name: 'GPT Image 1 (Latest)',
                  enabled: true,
                  quality: 'standard',
                  size: '1024x1024',
                  style: 'vivid',
                  useCase: 'image',
                },
                {
                  id: 'dall-e-3',
                  name: 'DALL-E 3',
                  enabled: true,
                  quality: 'standard',
                  size: '1024x1024',
                  style: 'vivid',
                  useCase: 'image',
                },

                // ===== Audio =====
                {
                  id: 'tts-1-hd',
                  name: 'TTS HD (Text-to-Speech)',
                  enabled: true,
                  useCase: 'tts',
                  voice: 'alloy',
                },
                {
                  id: 'whisper-1',
                  name: 'Whisper (Speech-to-Text)',
                  enabled: true,
                  useCase: 'text',
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

                // Text generation settings
                {
                  type: 'collapsible',
                  admin: {
                    condition: (_, siblingData) => siblingData.useCase === 'text',
                    initCollapsed: false,
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'temperature',
                          type: 'number',
                          admin: {
                            description:
                              'Controls randomness. 0 = deterministic, 2 = very creative.',
                            width: '50%',
                          },
                          defaultValue: 1.0,
                          label: 'Temperature',
                          max: 2,
                          min: 0,
                        },
                        {
                          name: 'maxTokens',
                          type: 'number',
                          admin: {
                            description:
                              'Maximum number of tokens to generate. Leave empty for model default.',
                            width: '50%',
                          },
                          label: 'Max Tokens',
                        },
                      ],
                    },
                  ],
                  label: 'Basic Settings',
                },

                // Advanced sampling
                {
                  type: 'collapsible',
                  admin: {
                    condition: (_, siblingData) => siblingData.useCase === 'text',
                    initCollapsed: true,
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'topP',
                          type: 'number',
                          admin: {
                            description: 'Nucleus sampling probability threshold.',
                            width: '33%',
                          },
                          defaultValue: 1.0,
                          label: 'Top P',
                          max: 1,
                          min: 0,
                        },
                        {
                          name: 'frequencyPenalty',
                          type: 'number',
                          admin: {
                            description: 'Penalize tokens based on frequency in the text.',
                            width: '33%',
                          },
                          defaultValue: 0,
                          label: 'Frequency Penalty',
                          max: 2,
                          min: -2,
                        },
                        {
                          name: 'presencePenalty',
                          type: 'number',
                          admin: {
                            description: 'Penalize tokens based on presence in the text.',
                            width: '33%',
                          },
                          defaultValue: 0,
                          label: 'Presence Penalty',
                          max: 2,
                          min: -2,
                        },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'seed',
                          type: 'number',
                          admin: {
                            description: 'Optional. Seed for deterministic sampling.',
                            width: '50%',
                          },
                          label: 'Seed',
                        },
                        {
                          name: 'logitBias',
                          type: 'json',
                          admin: {
                            description:
                              'Modify likelihood of tokens (JSON object mapping token IDs to bias).',
                            width: '50%',
                          },
                          label: 'Logit Bias',
                        },
                      ],
                    },
                  ],
                  label: 'Advanced Sampling',
                },

                // Image-specific settings
                {
                  type: 'collapsible',
                  admin: {
                    condition: (_, siblingData) => siblingData.useCase === 'image',
                    initCollapsed: false,
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'size',
                          type: 'select',
                          admin: {
                            description: 'Image dimensions.',
                            width: '50%',
                          },
                          defaultValue: '1024x1024',
                          label: 'Size',
                          options: [
                            { label: '1024x1024 (Square)', value: '1024x1024' },
                            { label: '1024x1792 (Portrait)', value: '1024x1792' },
                            { label: '1792x1024 (Landscape)', value: '1792x1024' },
                          ],
                        },
                        {
                          name: 'quality',
                          type: 'select',
                          admin: {
                            description: 'Image quality (DALL-E 3 only).',
                            width: '50%',
                          },
                          defaultValue: 'standard',
                          label: 'Quality',
                          options: [
                            { label: 'Standard', value: 'standard' },
                            { label: 'HD', value: 'hd' },
                          ],
                        },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'style',
                          type: 'select',
                          admin: {
                            description: 'Image style (DALL-E 3 only).',
                            width: '50%',
                          },
                          label: 'Style',
                          options: [
                            { label: 'Vivid', value: 'vivid' },
                            { label: 'Natural', value: 'natural' },
                          ],
                        },
                      ],
                    },
                  ],
                  label: 'Image Settings',
                },

                // TTS-specific settings
                {
                  type: 'collapsible',
                  admin: {
                    condition: (_, siblingData) => siblingData.useCase === 'tts',
                    initCollapsed: false,
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'voice',
                          type: 'select',
                          admin: {
                            description: 'Voice for text-to-speech.',
                            width: '50%',
                          },
                          defaultValue: 'alloy',
                          label: 'Voice',
                          options: [
                            { label: 'Alloy', value: 'alloy' },
                            { label: 'Echo', value: 'echo' },
                            { label: 'Fable', value: 'fable' },
                            { label: 'Onyx', value: 'onyx' },
                            { label: 'Nova', value: 'nova' },
                            { label: 'Shimmer', value: 'shimmer' },
                          ],
                        },
                        {
                          name: 'speed',
                          type: 'number',
                          admin: {
                            description: 'Speed of speech (0.25 to 4.0).',
                            width: '50%',
                          },
                          defaultValue: 1.0,
                          label: 'Speed',
                          max: 4,
                          min: 0.25,
                        },
                      ],
                    },
                  ],
                  label: 'TTS Settings',
                },

                // Enabled checkbox
                {
                  name: 'enabled',
                  type: 'checkbox',
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
  imageURL: '/provider-icons/openai.webp',
  labels: {
    plural: 'OpenAI Providers',
    singular: 'OpenAI',
  },
}
