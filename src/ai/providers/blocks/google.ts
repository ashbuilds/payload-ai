import type { Block } from 'payload'

export const googleBlock: Block = {
  slug: 'google',
  custom: {
    providerOptionsSchemas: {
      image: {
        fields: ['aspectRatio', 'personGeneration', 'seed', 'addWatermark'],
      },
      text: {
        fields: ['temperature', 'maxOutputTokens', 'topP', 'topK', 'safetySettings'],
      },
      tts: {
        fields: ['speed', 'volumeGainDb', 'speakingRate'],
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
                  'Optional. If empty, @ai-sdk/google will use the GOOGLE_GENERATIVE_AI_API_KEY environment variable.',
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
                          'Optional. Override default API endpoint (defaults to https://generativelanguage.googleapis.com/v1beta).',
                      },
                      label: 'Base URL',
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
                description: 'Available voices for Gemini TTS models.',
                initCollapsed: false,
              },
              defaultValue: [
                { id: 'Puck', name: 'Puck (Upbeat)', enabled: true },
                { id: 'Charon', name: 'Charon (Informative)', enabled: true },
                { id: 'Kore', name: 'Kore (Firm)', enabled: true },
                { id: 'Fenrir', name: 'Fenrir (Excitable)', enabled: true },
                { id: 'Aoede', name: 'Aoede (Breezy)', enabled: true },
                { id: 'Zephyr', name: 'Zephyr (Bright)', enabled: true },
              ],
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'id',
                      type: 'text',
                      admin: {
                        description: 'Voice ID used by Google API',
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
            // TTS Settings
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
                  label: 'Speaking Rate',
                  max: 4.0,
                  min: 0.25,
                  step: 0.25,
                },
                {
                  name: 'volumeGainDb',
                  type: 'number',
                  defaultValue: 0,
                  label: 'Volume Gain (dB)',
                },
              ],
              label: 'TTS Provider Options',
            },

            // Image Settings
            {
              name: 'imageProviderOptions',
              type: 'group',
              admin: {
                description: 'Default provider options for image generation models.',
              },
              fields: [
                {
                  name: 'aspectRatio',
                  type: 'select',
                  dbName: 'google-image-aspectRatio',
                  defaultValue: '1:1',
                  label: 'Default Aspect Ratio',
                  options: [
                    { label: '1:1 (Square)', value: '1:1' },
                    { label: '16:9 (Landscape)', value: '16:9' },
                    { label: '9:16 (Portrait)', value: '9:16' },
                    { label: '4:3', value: '4:3' },
                    { label: '3:4', value: '3:4' },
                  ],
                },
                {
                  name: 'personGeneration',
                  type: 'select',
                  dbName: 'google-image-personGeneration',
                  defaultValue: 'allow_adult',
                  label: 'Person Generation (Imagen)',
                  options: [
                    { label: 'Allow Adults Only', value: 'allow_adult' },
                    { label: 'Allow All', value: 'allow_all' },
                    { label: 'Do Not Allow', value: 'dont_allow' },
                  ],
                },
                {
                  name: 'addWatermark',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Add SynthID Watermark',
                },
              ],
              label: 'Image Provider Options',
            },

            // Text Settings
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
                  step: 0.1,
                },
                {
                  name: 'maxOutputTokens',
                  type: 'number',
                  label: 'Max Output Tokens',
                },
                {
                  name: 'topP',
                  type: 'number',
                  defaultValue: 0.95,
                  label: 'Top P',
                  max: 1.0,
                  min: 0.0,
                },
                {
                  name: 'topK',
                  type: 'number',
                  defaultValue: 40,
                  label: 'Top K',
                },
                {
                  name: 'safetySettings',
                  type: 'array',
                  admin: {
                    description: 'Safety filter settings',
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'category',
                          type: 'select',
                          dbName: 'google-safety-category',
                          label: 'Category',
                          options: [
                            { label: 'Harassment', value: 'HARM_CATEGORY_HARASSMENT' },
                            { label: 'Hate Speech', value: 'HARM_CATEGORY_HATE_SPEECH' },
                            { label: 'Sexually Explicit', value: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' },
                            { label: 'Dangerous Content', value: 'HARM_CATEGORY_DANGEROUS_CONTENT' },
                          ],
                          required: true,
                          width: '50%',
                        },
                        {
                          name: 'threshold',
                          type: 'select',
                          dbName: 'google-safety-threshold',
                          label: 'Threshold',
                          options: [
                            { label: 'Block None', value: 'BLOCK_NONE' },
                            { label: 'Block Low+', value: 'BLOCK_LOW_AND_ABOVE' },
                            { label: 'Block Medium+', value: 'BLOCK_MEDIUM_AND_ABOVE' },
                            { label: 'Block High', value: 'BLOCK_ONLY_HIGH' },
                          ],
                          required: true,
                          width: '50%',
                        },
                      ],
                    },
                  ],
                  label: 'Default Safety Settings',
                },
              ],
              label: 'Text Provider Options',
            },
          ],
          label: 'Provider Options',
        },

        // 5. Models tab (Simplified)
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
              defaultValue: [
                // Text models
                {
                  id: 'gemini-3-pro-preview',
                  name: 'Gemini 3.0 Pro (Preview)',
                  enabled: true,
                  useCase: 'text',
                },
                {
                  id: 'gemini-2.5-pro',
                  name: 'Gemini 2.5 Pro',
                  enabled: true,
                  useCase: 'text',
                },
                {
                  id: 'gemini-2.5-flash',
                  name: 'Gemini 2.5 Flash',
                  enabled: true,
                  useCase: 'text',
                },
                {
                  id: 'gemini-1.5-pro-latest',
                  name: 'Gemini 1.5 Pro (Latest)',
                  enabled: true,
                  useCase: 'text',
                },
                {
                  id: 'gemini-1.5-flash-latest',
                  name: 'Gemini 1.5 Flash (Latest)',
                  enabled: true,
                  useCase: 'text',
                },

                // Image models
                {
                  id: 'imagen-3.0-generate-002',
                  name: 'Imagen 3 (Fast)',
                  enabled: true,
                  useCase: 'image',
                },

                // TTS Models
                {
                  id: 'gemini-2.5-pro-preview-tts', // As requested
                  name: 'Gemini 2.5 Pro TTS (Preview)',
                  enabled: true,
                  useCase: 'tts',
                },
                {
                  id: 'gemini-2.5-flash-preview-tts', // As requested
                  name: 'Gemini 2.5 Flash TTS (Preview)',
                  enabled: true,
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
                          'Exact model id as used with @ai-sdk/google.',
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
                      dbName: 'google-model-useCase',
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
  imageURL: '/provider-icons/google-gemini.webp',
  labels: {
    plural: 'Google Providers',
    singular: 'Google Gemini',
  },
}
