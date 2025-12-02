import type { Block } from 'payload'

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

        // 2. Connection / HTTP tab
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

        // 3. Models tab
        {
          fields: [
            {
              name: 'models',
              type: 'array',
              admin: {
                components: {
                  // Adjust the path to wherever you put the component
                  RowLabel: '@ai-stack/payloadcms/client#GoogleModelRowLabel',
                },
                description: 'Keep this list short. Enable only the models you actually use.',
                initCollapsed: false,
              },
              label: 'Available Models',
              labels: {
                plural: 'Models',
                singular: 'Model',
              },
              // keep this concise and current
              defaultValue: [
                // Text / multimodal text models
                {
                  id: 'gemini-3-pro-preview',
                  name: 'Gemini 3 Pro (Preview)',
                  enabled: true,
                  temperature: 1.0,
                  topK: 40,
                  topP: 0.95,
                  useCase: 'text',
                },
                {
                  id: 'gemini-2.5-pro',
                  name: 'Gemini 2.5 Pro',
                  enabled: true,
                  temperature: 1.0,
                  topK: 40,
                  topP: 0.95,
                  useCase: 'text',
                },
                {
                  id: 'gemini-2.5-flash',
                  name: 'Gemini 2.5 Flash',
                  enabled: true,
                  temperature: 1.0,
                  topK: 40,
                  topP: 0.95,
                  useCase: 'text',
                },
                // Image capable models via response modalities
                {
                  id: 'gemini-3-pro-image-preview',
                  name: 'Gemini 3 Pro Image (Preview)',
                  aspectRatio: '1:1',
                  enabled: true,
                  responseModalities: ['IMAGE', 'TEXT'],
                  useCase: 'image',
                },
                // Imagen 3 via google.image(...)
                {
                  id: 'imagen-3.0-generate-002',
                  name: 'Imagen 3 (002)',
                  aspectRatio: '1:1',
                  enabled: true,
                  useCase: 'image',
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
                          'Exact model id as used with @ai-sdk/google, for example gemini-3-pro-preview.',
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
                        { label: 'Embeddings', value: 'embedding' },
                      ],
                    },
                  ],
                },

                // Basic sampling
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
                              'Optional upper limit for generated tokens. Leave empty to let the SDK decide.',
                            width: '50%',
                          },
                          label: 'Max Output Tokens',
                        },
                      ],
                    },
                  ],
                  label: 'Basic Settings',
                },

                // Advanced sampling (topP / topK)
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
                          name: 'topP',
                          type: 'number',
                          admin: {
                            description: 'Nucleus sampling probability threshold.',
                            width: '50%',
                          },
                          defaultValue: 0.95,
                          label: 'Top P',
                          max: 1,
                          min: 0,
                        },
                        {
                          name: 'topK',
                          type: 'number',
                          admin: {
                            description: 'Limit sampling to the K most probable tokens.',
                            width: '50%',
                          },
                          defaultValue: 40,
                          label: 'Top K',
                          min: 1,
                        },
                      ],
                    },
                  ],
                  label: 'Advanced Sampling',
                },

                // Output and response options
                {
                  type: 'collapsible',
                  admin: {
                    initCollapsed: true,
                  },
                  fields: [
                    {
                      name: 'responseModalities',
                      type: 'select',
                      admin: {
                        condition: (_, siblingData) =>
                          siblingData.useCase === 'text' || siblingData.useCase === 'image',
                        description:
                          'Gemini models that support it can return text, images, or both. Leave empty for text only.',
                      },
                      hasMany: true,
                      label: 'Response Modalities',
                      options: [
                        { label: 'Text', value: 'TEXT' },
                        { label: 'Image', value: 'IMAGE' },
                      ],
                    },
                  ],
                  label: 'Output & Response',
                },

                // Image specific
                {
                  type: 'collapsible',
                  admin: {
                    condition: (_, siblingData) => siblingData.useCase === 'image',
                    initCollapsed: true,
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'aspectRatio',
                          type: 'select',
                          admin: {
                            description:
                              'Used as imageConfig.aspectRatio for models that support it.',
                            width: '50%',
                          },
                          defaultValue: '1:1',
                          label: 'Aspect Ratio',
                          options: [
                            { label: '1:1 (Square)', value: '1:1' },
                            { label: '2:3 (Classic Portrait)', value: '2:3' },
                            { label: '3:2 (Classic Landscape)', value: '3:2' },
                            { label: '3:4 (Portrait)', value: '3:4' },
                            { label: '4:3 (Landscape)', value: '4:3' },
                            { label: '4:5 (Social Portrait)', value: '4:5' },
                            { label: '5:4 (Print)', value: '5:4' },
                            { label: '9:16 (Mobile)', value: '9:16' },
                            { label: '16:9 (Widescreen)', value: '16:9' },
                            { label: '21:9 (Cinematic)', value: '21:9' },
                          ],
                        },
                        {
                          name: 'personGeneration',
                          type: 'select',
                          admin: {
                            description:
                              'Imagen models option. Controls whether people can be generated.',
                            width: '50%',
                          },
                          defaultValue: 'allow_adult',
                          label: 'Person Generation',
                          options: [
                            { label: 'Allow Adults Only', value: 'allow_adult' },
                            { label: 'Allow All', value: 'allow_all' },
                            { label: 'Do Not Allow', value: 'dont_allow' },
                          ],
                        },
                      ],
                    },
                  ],
                  label: 'Image Settings',
                },

                // Thinking settings (Gemini 2.5 / 3)
                {
                  type: 'collapsible',
                  admin: {
                    condition: (_, siblingData) =>
                      typeof siblingData.id === 'string' &&
                      (siblingData.id.includes('gemini-2.5') ||
                        siblingData.id.includes('gemini-3')),
                    initCollapsed: true,
                  },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'thinkingLevel',
                          type: 'select',
                          admin: {
                            description: 'For Gemini 3 models. Controls depth of reasoning.',
                            width: '33%',
                          },
                          label: 'Thinking Level (Gemini 3)',
                          options: [
                            { label: 'Low (Faster)', value: 'low' },
                            { label: 'High (Better Reasoning)', value: 'high' },
                          ],
                        },
                        {
                          name: 'thinkingBudget',
                          type: 'number',
                          admin: {
                            description:
                              'Approx token budget for thinking step. For Gemini 2.5 models.',
                            width: '33%',
                          },
                          label: 'Thinking Budget (Gemini 2.5)',
                        },
                        {
                          name: 'includeThoughts',
                          type: 'checkbox',
                          admin: {
                            description:
                              'If true, exposes high level reasoning summaries in the response metadata.',
                            width: '33%',
                          },
                          label: 'Include Thought Summaries',
                        },
                      ],
                    },
                  ],
                  label: 'Thinking Settings',
                },

                // Safety settings per model
                {
                  type: 'collapsible',
                  admin: {
                    initCollapsed: true,
                  },
                  fields: [
                    {
                      name: 'safetySettings',
                      type: 'array',
                      fields: [
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
                                {
                                  label: 'Harassment',
                                  value: 'HARM_CATEGORY_HARASSMENT',
                                },
                                {
                                  label: 'Hate Speech',
                                  value: 'HARM_CATEGORY_HATE_SPEECH',
                                },
                                {
                                  label: 'Sexually Explicit',
                                  value: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                                },
                                {
                                  label: 'Dangerous Content',
                                  value: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                                },
                              ],
                              required: true,
                            },
                            {
                              name: 'threshold',
                              type: 'select',
                              admin: {
                                width: '50%',
                              },
                              label: 'Threshold',
                              options: [
                                {
                                  label: 'Block None',
                                  value: 'BLOCK_NONE',
                                },
                                {
                                  label: 'Block Low and Above',
                                  value: 'BLOCK_LOW_AND_ABOVE',
                                },
                                {
                                  label: 'Block Medium and Above',
                                  value: 'BLOCK_MEDIUM_AND_ABOVE',
                                },
                                {
                                  label: 'Block Only High',
                                  value: 'BLOCK_ONLY_HIGH',
                                },
                              ],
                              required: true,
                            },
                          ],
                        },
                      ],
                      label: 'Safety Filters',
                    },
                  ],
                  label: 'Safety Settings',
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
