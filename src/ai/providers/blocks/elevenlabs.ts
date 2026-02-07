import type { Block } from 'payload'

import { ElevenLabsIcon } from '../icons.js'

export const elevenlabsBlock: Block = {
  slug: 'elevenlabs',
  custom: {
    providerOptionsSchemas: {
      tts: {
        fields: [
          'stability',
          'similarity_boost',
          'style',
          'use_speaker_boost',
          'seed',
          'language_code',
          'apply_text_normalization',
          'apply_language_text_normalization',
        ],
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

        // 3. Voices tab (Existing)
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
                      dbName: 'eleven-voice-category',
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

        // 4. Provider Options (NEW)
        {
          fields: [
            {
              name: 'ttsProviderOptions',
              type: 'group',
              admin: {
                description: 'Default provider options for ElevenLabs TTS.',
              },
              fields: [
                {
                  name: 'voice_settings',
                  type: 'group',
                  fields: [
                    {
                      name: 'stability',
                      type: 'number',
                      defaultValue: 0.5,
                      label: 'Default Stability',
                      max: 1,
                      min: 0,
                    },
                    {
                      name: 'similarity_boost',
                      type: 'number',
                      defaultValue: 0.75,
                      label: 'Default Similarity Boost',
                      max: 1,
                      min: 0,
                    },
                    {
                      name: 'style',
                      type: 'number',
                      defaultValue: 0,
                      label: 'Default Style',
                      max: 1,
                      min: 0,
                    },
                    {
                      name: 'use_speaker_boost',
                      type: 'checkbox',
                      defaultValue: false,
                      label: 'Use Speaker Boost',
                    },
                  ],
                  label: 'Voice Settings',
                },
                {
                  name: 'seed',
                  type: 'number',
                  label: 'Default Seed',
                  max: 4294967295,
                  min: 0,
                },
                {
                  name: 'apply_text_normalization',
                  type: 'select',
                  dbName: 'eleven-tts-normalization',
                  defaultValue: 'auto',
                  label: 'Text Normalization',
                  options: [
                    { label: 'Auto', value: 'auto' },
                    { label: 'On', value: 'on' },
                    { label: 'Off', value: 'off' },
                  ],
                },
                {
                  name: 'language_code',
                  type: 'text',
                  admin: {
                    placeholder: 'en',
                  },
                  label: 'Language Code',
                },
              ],
              label: 'TTS Provider Options',
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
                description:
                  'Configure TTS models. Use the Voices and Provider Options tabs for detailed settings.',
                initCollapsed: true,
              },
              defaultValue: [
                {
                  id: 'eleven_flash_v2_5',
                  name: 'Flash V2.5 (Fastest)',
                  enabled: true,
                  responseModalities: ['AUDIO'],
                  useCase: 'tts',
                },
                {
                  id: 'eleven_turbo_v2_5',
                  name: 'Turbo V2.5 (Latest)',
                  enabled: true,
                  responseModalities: ['AUDIO'],
                  useCase: 'tts',
                },
                {
                  id: 'eleven_multilingual_v2',
                  name: 'Multilingual V2',
                  enabled: true,
                  responseModalities: ['AUDIO'],
                  useCase: 'tts',
                },
                {
                  id: 'eleven_turbo_v2',
                  name: 'Turbo V2',
                  enabled: false,
                  responseModalities: ['AUDIO'],
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
                        width: '33%',
                      },
                      dbName: 'eleven-model-useCase',
                      defaultValue: 'tts',
                      label: 'Use Case',
                      options: [{ label: 'Text-to-Speech', value: 'tts' }],
                    },
                    {
                      name: 'responseModalities',
                      type: 'select',
                      admin: {
                        description: 'Output capabilities of this model',
                        width: '33%',
                      },
                      dbName: 'eleven-model-modalities',
                      hasMany: true,
                      label: 'Response Modalities',
                      options: [
                        { label: 'Text', value: 'TEXT' },
                        { label: 'Audio', value: 'AUDIO' },
                      ],
                    },
                    {
                      name: 'enabled',
                      type: 'checkbox',
                      admin: {
                        width: '33%',
                      },
                      defaultValue: true,
                      label: 'Enabled',
                    },
                  ],
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
  imageURL: ElevenLabsIcon,
  labels: {
    plural: 'ElevenLabs Providers',
    singular: 'ElevenLabs',
  },
}
