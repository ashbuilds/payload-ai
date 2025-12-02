import type { Block } from 'payload'

export const elevenlabsBlock: Block = {
  slug: 'elevenlabs',
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
                  'Your ElevenLabs API key. Will be encrypted in the database. Get yours at elevenlabs.io',
              },
              label: 'API Key',
              required: true,
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
                  name: 'baseURL',
                  type: 'text',
                  admin: {
                    description:
                      'Optional. Override default API endpoint (defaults to https://api.elevenlabs.io/v1).',
                  },
                  defaultValue: 'https://api.elevenlabs.io/v1',
                  label: 'Base URL',
                },
                {
                  name: 'headers',
                  type: 'array',
                  admin: {
                    description: 'Optional. Custom headers to send with every request.',
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

        // 3. Voices tab
        {
          fields: [
            {
              name: 'voicesFetcherUI',
              type: 'ui',
              admin: {
                components: {
                  Field: '@ai-stack/payloadcms/client#VoicesFetcher',
                },
              },
            },
            {
              name: 'voices',
              type: 'array',
              admin: {
                description:
                  'Use the "Fetch Voices" button above to populate this list from your ElevenLabs account.',
                initCollapsed: false,
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'id',
                      type: 'text',
                      admin: {
                        description: 'Voice ID from ElevenLabs',
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
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'category',
                      type: 'select',
                      admin: {
                        width: '50%',
                      },
                      label: 'Category',
                      options: [
                        { label: 'Premade', value: 'premade' },
                        { label: 'Cloned', value: 'cloned' },
                        { label: 'Professional', value: 'professional' },
                        { label: 'Generated', value: 'generated' },
                      ],
                    },
                    {
                      name: 'preview_url',
                      type: 'text',
                      admin: {
                        width: '50%',
                      },
                      label: 'Preview URL',
                    },
                  ],
                },
                {
                  name: 'labels',
                  type: 'json',
                  admin: {
                    description:
                      'Voice attributes like gender, age, accent (JSON object). Example: {"gender": "female", "age": "young", "accent": "american"}',
                  },
                  label: 'Labels',
                },
              ],
              label: 'Available Voices',
            },
          ],
          label: 'Voices',
        },

        // 4. Models tab
        {
          fields: [
            {
              name: 'models',
              type: 'array',
              admin: {
                components: {
                  RowLabel: '@ai-stack/payloadcms/client#ModelRowLabel',
                },
                description: 'Configure TTS models with specific voice settings and parameters.',
                initCollapsed: false,
              },
              defaultValue: [
                {
                  id: 'eleven_flash_v2_5',
                  name: 'Flash V2.5 (Fastest)',
                  enabled: true,
                  useCase: 'tts',
                },
                {
                  id: 'eleven_turbo_v2_5',
                  name: 'Turbo V2.5 (Latest)',
                  enabled: true,
                  useCase: 'tts',
                },
                {
                  id: 'eleven_multilingual_v2',
                  name: 'Multilingual V2',
                  enabled: true,
                  useCase: 'tts',
                },
                {
                  id: 'eleven_turbo_v2',
                  name: 'Turbo V2',
                  enabled: false,
                  useCase: 'tts',
                },
              ],
              fields: [
                // Basic info
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'id',
                      type: 'text',
                      admin: {
                        description: 'Model ID (e.g., eleven_flash_v2_5)',
                        width: '50%',
                      },
                      label: 'Model ID',
                      required: true,
                    },
                    {
                      name: 'name',
                      type: 'text',
                      admin: {
                        width: '50%',
                      },
                      label: 'Display Name',
                      required: true,
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'useCase',
                      type: 'select',
                      admin: {
                        width: '50%',
                      },
                      defaultValue: 'tts',
                      label: 'Use Case',
                      options: [{ label: 'Text-to-Speech', value: 'tts' }],
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

                // Voice Settings
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
                          name: 'stability',
                          type: 'number',
                          admin: {
                            description:
                              'Voice stability (0-1). Lower = more emotional range, higher = more monotonous.',
                            step: 0.01,
                            width: '50%',
                          },
                          label: 'Stability',
                          max: 1,
                          min: 0,
                        },
                        {
                          name: 'similarity_boost',
                          type: 'number',
                          admin: {
                            description: 'How closely AI adheres to the original voice (0-1).',
                            step: 0.01,
                            width: '50%',
                          },
                          label: 'Similarity Boost',
                          max: 1,
                          min: 0,
                        },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'style',
                          type: 'number',
                          admin: {
                            description:
                              'Amplify speaker style (0-1). Values above 0 may increase latency.',
                            step: 0.01,
                            width: '50%',
                          },
                          label: 'Style',
                          max: 1,
                          min: 0,
                        },
                        {
                          name: 'use_speaker_boost',
                          type: 'checkbox',
                          admin: {
                            description:
                              'Boost similarity to original speaker (increases latency).',
                            width: '50%',
                          },
                          label: 'Use Speaker Boost',
                        },
                      ],
                    },
                  ],
                  label: 'Voice Settings',
                },

                // Advanced Settings
                {
                  type: 'collapsible',
                  admin: {
                    initCollapsed: true,
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'language_code',
                          type: 'text',
                          admin: {
                            description:
                              'ISO 639-1 language code (only for Turbo v2.5 and Flash v2.5).',
                            placeholder: 'en',
                            width: '50%',
                          },
                          label: 'Language Code',
                        },
                        {
                          name: 'seed',
                          type: 'number',
                          admin: {
                            description: 'Seed for deterministic sampling (0-4294967295).',
                            width: '50%',
                          },
                          label: 'Seed',
                          max: 4294967295,
                          min: 0,
                        },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'apply_text_normalization',
                          type: 'select',
                          admin: {
                            description: 'Controls text normalization (spell out numbers, etc.)',
                            width: '50%',
                          },
                          dbName: 'text_norm',
                          defaultValue: 'auto',
                          label: 'Text Normalization',
                          options: [
                            { label: 'Auto (System Decides)', value: 'auto' },
                            { label: 'Always On', value: 'on' },
                            { label: 'Always Off', value: 'off' },
                          ],
                        },
                        {
                          name: 'apply_language_text_normalization',
                          type: 'checkbox',
                          admin: {
                            description:
                              'Language-specific normalization (e.g., Japanese). May increase latency.',
                            width: '50%',
                          },
                          label: 'Language Normalization',
                        },
                      ],
                    },
                  ],
                  label: 'Advanced Settings',
                },
              ],
              label: 'Available Models',
              labels: {
                plural: 'Models',
                singular: 'Model',
              },
            },
          ],
          label: 'Models',
        },
      ],
    },
  ],
  imageURL: '/provider-icons/elevenlabs.webp',
  labels: {
    plural: 'ElevenLabs Providers',
    singular: 'ElevenLabs',
  },
}
