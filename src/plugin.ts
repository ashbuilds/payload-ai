import type { CollectionConfig, Config, GlobalConfig } from 'payload'

import { deepMerge } from 'payload/shared'

import type { PluginConfig } from './types.js'

import { lexicalJsonSchema } from './ai/schemas/lexicalJsonSchema.js'
import { aiJobsCollection } from './collections/AIJobs.js'
import { AIProvidersGlobal } from './collections/AIProviders.js'
import { instructionsCollection } from './collections/Instructions.js'
import { PLUGIN_NAME } from './defaults.js'
import { fetchFields } from './endpoints/fetchFields.js'
import { fetchVoices } from './endpoints/fetchVoices.js'
import { endpoints } from './endpoints/index.js'
import { translations } from './translations/index.js'
import { isPluginActivated } from './utilities/isPluginActivated.js'
import { updateFieldsConfig } from './utilities/updateFieldsConfig.js'

const defaultPluginConfig: PluginConfig = {
  access: {
    generate: ({ req }) => !!req.user,
    settings: ({ req }) => !!req.user,
  },
  disableSponsorMessage: false,
}

const sponsorMessage = `
╔═══════════════════════════════════════════════════════════════╗
║       THANK YOU FOR USING THE PAYLOAD AI PLUGIN!              ║
║                                                               ║
║  If this plugin makes your life easier, please                ║
║  consider supporting its development and maintenance:         ║
║                                                               ║
║    • Buy me a coffee: https://buymeacoffee.com/ashbuilds      ║
║    • Sponsor on GitHub: https://github.com/sponsors/ashbuilds ║
║                                                               ║
║  Your support fuels continued improvements,                   ║
║  new features, and more caffeinated coding sessions! ☕        ║
║                                                               ║
║  Got feedback or need help? Submit an issue here:             ║
║    • https://github.com/ashbuilds/payload-ai/issues/new       ║
║                                                               ║
║  Thank you again, and happy building!                         ║
╚═══════════════════════════════════════════════════════════════╝
`

const securityMessage = `
╔═══════════════════════════════════════════════════════════════╗
║                    SECURITY NOTICE                            ║
║                                                               ║
║  The AI Plugin now requires authentication by default.        ║
║  All AI features are restricted to authenticated users.       ║
║                                                               ║
║  To customize access control, configure the 'access' option   ║
║  in your plugin settings. See documentation for details.      ║
║                                                               ║
║  If you need different access patterns, please configure      ║
║  them explicitly in your plugin configuration.                ║
╚═══════════════════════════════════════════════════════════════╝
`

const payloadAiPlugin =
  (pluginConfig: PluginConfig) =>
  (incomingConfig: Config): Config => {
    pluginConfig = {
      ...defaultPluginConfig,
      ...pluginConfig,
      access: {
        ...defaultPluginConfig.access,
        ...pluginConfig.access,
      },
    }

    const isActivated = isPluginActivated(pluginConfig)
    let updatedConfig: Config = { ...incomingConfig }

    if (isActivated) {
      const Instructions = instructionsCollection(pluginConfig)
      const AIJobs = aiJobsCollection()
      // Inject editor schema to config, so that it can be accessed when /textarea endpoint will hit
      const lexicalSchema = lexicalJsonSchema(pluginConfig.editorConfig?.nodes)

      Instructions.admin = {
        ...Instructions.admin,
      }

      if (pluginConfig.debugging) {
        Instructions.admin.hidden = false
      }

      Instructions.admin.custom = {
        ...(Instructions.admin.custom || {}),
        [PLUGIN_NAME]: {
          editorConfig: {
            // Used in admin client for useObject hook
            schema: lexicalSchema,
          },
        },
      }

      const collections = [...(incomingConfig.collections ?? []), Instructions, AIJobs]
      const globals = [...(incomingConfig.globals ?? []), AIProvidersGlobal]
      const { globals: globalsSlugs } = pluginConfig

      const { components: { providers = [] } = {} } = incomingConfig.admin || {}
      const updatedProviders = [
        ...(providers ?? []),
        {
          path: '@ai-stack/payloadcms/client#InstructionsProvider',
        },
      ]

      incomingConfig.admin = {
        ...(incomingConfig.admin || {}),
        components: {
          ...(incomingConfig.admin?.components ?? {}),
          providers: updatedProviders,
        },
      }

      const pluginEndpoints = endpoints(pluginConfig)
      updatedConfig = {
        ...incomingConfig,
        collections: collections.map((collection) => {
          // Always inject fields, but they will be dynamically enabled/disabled by the InstructionsProvider
          const { updatedCollectionConfig } = updateFieldsConfig(collection)
          return updatedCollectionConfig as CollectionConfig
        }),
        endpoints: [
          ...(incomingConfig.endpoints ?? []),
          pluginEndpoints.textarea,
          pluginEndpoints.upload,
          ...(pluginEndpoints.videogenWebhook ? [pluginEndpoints.videogenWebhook] : []),
          fetchFields(pluginConfig),
          fetchVoices,
        ],
        globals: globals.map((global) => {
          if (globalsSlugs && globalsSlugs[global.slug]) {
            const { updatedCollectionConfig } = updateFieldsConfig(global)
            return updatedCollectionConfig as GlobalConfig
          }

          return global
        }),
        i18n: {
          ...(incomingConfig.i18n || {}),
          translations: {
            ...deepMerge(translations, incomingConfig.i18n?.translations ?? {}),
          },
        },
      }
    }

    updatedConfig.onInit = async (payload) => {
      if (incomingConfig.onInit) {
        await incomingConfig.onInit(payload)
      }

      if (!isActivated) {
        payload.logger.warn(`— AI Plugin: Not activated. Please verify your environment keys.`)
        return
      }

      if (!pluginConfig.disableSponsorMessage) {
        setTimeout(() => {
          payload.logger.info(securityMessage)
        }, 1000)
        setTimeout(() => {
          payload.logger.info(sponsorMessage)
        }, 3000)
      }

      // Inject AI capabilities with the abstraction layer
      ;(payload as any).ai = {
        // Core generation methods
        generateObject: async (args: any) => {
          const { generateObject } = await import('./ai/core/index.js')
          return generateObject({ ...args, payload })
        },

        generateText: async (args: any) => {
          const { generateText } = await import('./ai/core/index.js')
          return generateText({ ...args, payload })
        },

        generateMedia: async (args: any) => {
          const { generateMedia } = await import('./ai/core/index.js')
          return generateMedia({ ...args, payload })
        },

        // Streaming variants
        streamObject: async (args: any) => {
          const { streamObject } = await import('./ai/core/index.js')
          const result = await streamObject({ ...args, payload })
          return result.toTextStreamResponse()
        },

        streamText: async (args: any) => {
          const { streamText } = await import('./ai/core/index.js')
          return streamText({ ...args, payload })
        },

        // Helper utilities
        getModel: async (provider: string, modelId: string, type?: 'image' | 'text' | 'tts') => {
          const { getImageModel, getLanguageModel, getTTSModel } = await import(
            './ai/providers/registry.js'
          )
          if (type === 'image') {
            return getImageModel(payload, provider, modelId)
          }
          if (type === 'tts') {
            return getTTSModel(payload, provider, modelId)
          }
          return getLanguageModel(payload, provider, modelId)
        },

        getRegistry: async () => {
          const { getProviderRegistry } = await import('./ai/providers/registry.js')
          return getProviderRegistry(payload)
        },

        // Legacy method for backward compatibility
        /** @deprecated Use generateObject or generateText instead */
        generate: async (args: any) => {
          const { generate } = await import('./ai/index.js')
          return generate({ ...args, payload })
        },
      }
    }

    return updatedConfig
  }

export { payloadAiPlugin }
