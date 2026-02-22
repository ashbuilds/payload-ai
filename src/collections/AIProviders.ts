import type { Field, GlobalConfig } from 'payload'

import { allProviderBlocks } from '../ai/providers/blocks/index.js'
import { invalidateProviderCache } from '../ai/providers/registry.js'

const providerOptionsField: Field = {
  name: 'providerOptions',
  type: 'array',
  admin: {
    description: 'Add custom options to pass to the provider.',
    initCollapsed: false,
  },
  fields: [
    {
      name: 'provider',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'key',
      type: 'text',
      label: 'Option Key',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          admin: {
            width: '30%',
          },
          defaultValue: 'text',
          label: 'Value Type',
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Number', value: 'number' },
            { label: 'Boolean', value: 'boolean' },
            { label: 'Options', value: 'options' },
          ],
          required: true,
        },
        {
          name: 'valueText',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'text',
            width: '70%',
          },
          label: 'Text',
        },
        {
          name: 'valueNumber',
          type: 'number',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'number',
            width: '70%',
          },
          label: 'Number',
        },
        {
          name: 'valueBoolean',
          type: 'checkbox',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'boolean',
            description: 'Select default state or leave empty',
            style: { marginTop: '26px' },
            width: '70%',
          },
          label: 'Enabled',
        },
        {
          name: 'valueOptions',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'options',
            description: 'Enter space separated text values',
            width: '70%',
          },
          hasMany: true,
          label: 'Options',
        },
      ],
    },
  ],
  label: 'Provider Options',
}

export const AIProvidersGlobal: GlobalConfig = {
  slug: 'ai-providers',
  access: {
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
  },
  admin: {
    description: 'Connect your providers and choose the default models used across your project.',
    group: false,
  },
  fields: [
    {
      name: 'providers',
      type: 'blocks',
      admin: {
        description:
          'Add one or more providers and set their credentials and settings. You can keep multiple providers and switch defaults below.',
        initCollapsed: true,
      },
      blocks: allProviderBlocks,
      label: 'AI Providers',
      required: true,
    },
    {
      name: 'enabledCollections',
      type: 'json',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'defaults',
      type: 'group',
      admin: {
        description:
          'Pick the default provider and model for each feature. These defaults are used unless a collection or field overrides them.',
      },
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              fields: [
                {
                  name: 'text',
                  type: 'group',
                  fields: [
                    {
                      name: 'provider',
                      type: 'text',
                      admin: {
                        components: {
                          Field: '@ai-stack/payloadcms/client#DynamicProviderSelect',
                        },
                      },
                      label: 'Default Provider',
                    },
                    {
                      name: 'model',
                      type: 'text',
                      admin: {
                        components: {
                          Field: '@ai-stack/payloadcms/client#DynamicModelSelect',
                        },
                      },
                      label: 'Default Model',
                    },
                    providerOptionsField,
                  ],
                  label: '',
                },
              ],
              label: 'Text Generation',
            },
            {
              fields: [
                {
                  name: 'image',
                  type: 'group',
                  fields: [
                    {
                      name: 'provider',
                      type: 'text',
                      admin: {
                        components: {
                          Field: '@ai-stack/payloadcms/client#DynamicProviderSelect',
                        },
                      },
                      label: 'Default Provider',
                    },
                    {
                      name: 'model',
                      type: 'text',
                      admin: {
                        components: {
                          Field: '@ai-stack/payloadcms/client#DynamicModelSelect',
                        },
                      },
                      label: 'Default Model',
                    },
                    providerOptionsField,
                  ],
                  label: '',
                },
              ],
              label: 'Image Generation',
            },
            {
              fields: [
                {
                  name: 'tts',
                  type: 'group',
                  fields: [
                    {
                      name: 'provider',
                      type: 'text',
                      admin: {
                        components: {
                          Field: '@ai-stack/payloadcms/client#DynamicProviderSelect',
                        },
                      },
                      label: 'Default Provider',
                    },
                    {
                      name: 'model',
                      type: 'text',
                      admin: {
                        components: {
                          Field: '@ai-stack/payloadcms/client#DynamicModelSelect',
                        },
                      },
                      label: 'Default Model',
                    },
                    {
                      name: 'voice',
                      type: 'text',
                      admin: {
                        components: {
                          Field: '@ai-stack/payloadcms/client#DynamicVoiceSelect',
                        },
                      },
                      label: 'Default Voice',
                    },
                    providerOptionsField,
                  ],
                  label: '',
                },
              ],
              label: 'Speech Generation',
            },
            {
              admin: {
                disabled: true,
              },
              fields: [
                {
                  name: 'video',
                  type: 'group',
                  fields: [
                    {
                      name: 'provider',
                      type: 'text',
                      admin: {
                        components: {
                          Field: '@ai-stack/payloadcms/client#DynamicProviderSelect',
                        },
                      },
                      label: 'Default Provider',
                    },
                    {
                      name: 'model',
                      type: 'text',
                      admin: {
                        components: {
                          Field: '@ai-stack/payloadcms/client#DynamicModelSelect',
                        },
                      },
                      label: 'Default Model',
                    },
                  ],
                  label: '',
                },
              ],
              label: 'Video Generation',
            },
          ],
        },
      ],
      label: 'Default Models',
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        // Immediately invalidate cached provider registry so new settings take effect
        invalidateProviderCache()

        if (doc.enabledCollections && doc.enabledCollections.length > 0) {
          const { seedProperties } = await import('../utilities/seedProperties.js')
          await seedProperties({
            enabledCollections: doc.enabledCollections,
            req,
          })
        }
        return doc
      },
    ],
    afterRead: [
      async ({ context, doc, req }) => {
        if (!req.payload.secret) {
          return doc
        }

        const { decrypt } = await import('../utilities/encryption.js')

        if (doc.providers) {
          doc.providers = doc.providers.map((provider: any) => {
            if (provider.apiKey) {
              if (context.unsafe) {
                // Internal use: decrypt
                provider.apiKey = decrypt(provider.apiKey, req.payload.secret)
              } else {
                // Admin UI: mask
                // We can't easily check if it's valid without decrypting, but for UI we just show mask
                // If we want to show "present", we can return a mask
                provider.apiKey = 'sk-****' + provider.apiKey.slice(-4)
              }
            }
            return provider
          })
        }
        return doc
      },
    ],
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        if (!req.payload.secret) {
          return data
        }

        const { encrypt } = await import('../utilities/encryption.js')

        // Iterate over providers and encrypt API keys
        if (data.providers) {
          data.providers = data.providers.map((provider: any) => {
            if (provider.apiKey) {
              const originalProvider = originalDoc?.providers?.find(
                (p: any) => p.id === provider.id,
              )

              // If the key strictly equals the existing one (e.g. partial update merge), do nothing.
              // This prevents re-encrypting an already encrypted key.
              if (originalProvider?.apiKey && provider.apiKey === originalProvider.apiKey) {
                return provider
              }

              // If it looks like a masked key, don't re-encrypt (it means it wasn't changed via UI)
              if (provider.apiKey.startsWith('sk-') && provider.apiKey.includes('****')) {
                // Restore the original encrypted key from originalDoc
                if (originalProvider?.apiKey) {
                  provider.apiKey = originalProvider.apiKey
                }
              } else {
                // Encrypt new key
                provider.apiKey = encrypt(provider.apiKey, req.payload.secret)
              }
            }
            return provider
          })
        }
        return data
      },
    ],
  },
  label: 'AI Providers',
}
