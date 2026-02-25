import type { Block } from 'payload'

import { GoogleIcon } from '../icons.js'

export const googleBlock: Block = {
  slug: 'google',

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



        // 5. Models tab (Simplified)
        {
          fields: [
            {
              name: 'models',
              type: 'array',
              admin: {
                components: {
                  RowLabel: '@ai-stack/payloadcms/ui/ModelRowLabel/index.js#ModelRowLabel',
                },
                description: 'Keep this list short. Enable only the models you actually use.',
                initCollapsed: true,
              },
              defaultValue: [
                // Text models
                {
                  id: 'gemini-3-pro-preview',
                  name: 'Gemini 3.0 Pro (Preview)',
                  enabled: true,
                  responseModalities: ['TEXT'],
                  useCase: 'text',
                },
                {
                  id: 'gemini-2.5-pro',
                  name: 'Gemini 2.5 Pro',
                  enabled: true,
                  responseModalities: ['TEXT'],
                  useCase: 'text',
                },
                {
                  id: 'gemini-2.5-flash',
                  name: 'Gemini 2.5 Flash',
                  enabled: true,
                  responseModalities: ['TEXT'],
                  useCase: 'text',
                },
                {
                  id: 'gemini-1.5-pro-latest',
                  name: 'Gemini 1.5 Pro (Latest)',
                  enabled: true,
                  responseModalities: ['TEXT'],
                  useCase: 'text',
                },
                {
                  id: 'gemini-1.5-flash-latest',
                  name: 'Gemini 1.5 Flash (Latest)',
                  enabled: true,
                  responseModalities: ['TEXT'],
                  useCase: 'text',
                },

                // Image models
                {
                  id: 'gemini-2.5-flash-image',
                  name: 'Gemini 2.5 Flash Image',
                  enabled: true,
                  responseModalities: ['IMAGE', 'TEXT'],
                  useCase: 'image',
                },
                {
                  id: 'imagen-4.0-generate-001',
                  name: 'Imagen 4',
                  enabled: true,
                  // TODO: fix this with proper definition for multimodel or image model only
                  responseModalities: ['IMAGE'],
                  useCase: 'image',
                },
                {
                  id: 'gemini-3-pro-image-preview',
                  name: 'Gemini 3.0 Pro Image (Preview)',
                  enabled: true,
                  responseModalities: ['IMAGE', 'TEXT'],
                  useCase: 'image',
                },

                // TTS Models
                {
                  id: 'gemini-2.5-pro-preview-tts',
                  name: 'Gemini 2.5 Pro TTS (Preview)',
                  enabled: true,
                  responseModalities: ['AUDIO'],
                  useCase: 'tts',
                },
                {
                  id: 'gemini-2.5-flash-preview-tts',
                  name: 'Gemini 2.5 Flash TTS (Preview)',
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
                        description: 'Exact model id as used with @ai-sdk/google.',
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
                      dbName: 'google-model-useCase',
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
                  name: 'responseModalities',
                  type: 'select',
                  admin: {
                    description: 'Output capabilities of this model',
                    width: '50%',
                  },
                  dbName: 'google-model-modalities',
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
  imageURL: GoogleIcon,
  labels: {
    plural: 'Google Providers',
    singular: 'Google Gemini',
  },
}
