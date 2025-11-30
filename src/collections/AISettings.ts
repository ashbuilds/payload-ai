import type { GlobalConfig } from 'payload'

import { allProviderBlocks } from '../ai/providers/blocks/index.js'

export const aiSettingsGlobal: GlobalConfig = {
  slug: 'ai-settings',
  access: {
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
  },
  admin: {
    description: 'Configure AI providers, models, and default settings',
  },
  fields: [
    {
      name: 'providers',
      type: 'blocks',
      admin: {
        description: 'Configure which AI providers to use and their settings',
        initCollapsed: false,
      },
      blocks: allProviderBlocks,
      label: 'AI Providers',
      required: true,
    },
    {
      name: 'defaults',
      type: 'group',
      admin: {
        description: 'Default provider/model for each use case',
      },
      fields: [
        {
          name: 'text',
          type: 'group',
          fields: [
            {
              name: 'provider',
              type: 'text',
              admin: { description: 'Auto-populated from blocks' },
            },
            { name: 'model', type: 'text' },
          ],
          label: 'Text Generation',
        },
        {
          name: 'image',
          type: 'group',
          fields: [
            { name: 'provider', type: 'text' },
            { name: 'model', type: 'text' },
          ],
          label: 'Image Generation',
        },
        {
          name: 'video',
          type: 'group',
          fields: [
            { name: 'provider', type: 'text' },
            { name: 'model', type: 'text' },
          ],
          label: 'Video Generation',
        },
        {
          name: 'tts',
          type: 'group',
          fields: [
            { name: 'provider', type: 'text' },
            { name: 'model', type: 'text' },
          ],
          label: 'Text-to-Speech',
        },
      ],
      label: 'Default Models',
    },
  ],
  hooks: {
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
              // If it looks like a masked key, don't re-encrypt (it means it wasn't changed)
              if (provider.apiKey.startsWith('sk-') && provider.apiKey.includes('****')) {
                // Restore the original encrypted key from originalDoc
                const originalProvider = originalDoc?.providers?.find(
                  (p: any) => p.id === provider.id,
                )
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
  label: 'AI Configuration',
}
