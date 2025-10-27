import type { CollectionConfig, Config, GlobalConfig } from 'payload'

import { deepMerge } from 'payload/shared'

import type { PluginConfig } from './types.js'

import { defaultGenerationModels } from './ai/models/index.js'
import { lexicalJsonSchema } from './ai/schemas/lexicalJsonSchema.js'
import { instructionsCollection } from './collections/Instructions.js'
import { PLUGIN_NAME } from './defaults.js'
import { fetchFields } from './endpoints/fetchFields.js'
import { endpoints } from './endpoints/index.js'
import { init } from './init.js'
import { translations } from './translations/index.js'
import { getGenerationModels } from './utilities/getGenerationModels.js'
import { isPluginActivated } from './utilities/isPluginActivated.js'
import { updateFieldsConfig } from './utilities/updateFieldsConfig.js'

const defaultPluginConfig: PluginConfig = {
  access: {
    generate: ({ req }) => !!req.user,
    settings: ({ req }) => !!req.user,
  },
  collections: {},
  disableSponsorMessage: false,
  generatePromptOnInit: true,
  generationModels: defaultGenerationModels,
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

    pluginConfig.generationModels = getGenerationModels(pluginConfig)

    const isActivated = isPluginActivated(pluginConfig)
    let updatedConfig: Config = { ...incomingConfig }
    let collectionsFieldPathMap = {}

    if (isActivated) {
      const Instructions = instructionsCollection(pluginConfig)
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

      const collections = [...(incomingConfig.collections ?? []), Instructions]
      const globals = [...(incomingConfig.globals ?? [])]
      const { collections: collectionSlugs, globals: globalsSlugs } = pluginConfig

      const { components: { providers = [] } = {} } = incomingConfig.admin || {}
      const updatedProviders = [
        ...(providers ?? []),
        {
          path: '@ai-stack/payloadcms/client#InstructionsProvider',
        },
        {
          path: '@ai-stack/payloadcms/client#AgentProvider',
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
          if (collectionSlugs[collection.slug]) {
            const { schemaPathMap, updatedCollectionConfig } = updateFieldsConfig(collection)
            collectionsFieldPathMap = {
              ...collectionsFieldPathMap,
              ...schemaPathMap,
            }
            return updatedCollectionConfig as CollectionConfig
          }

          return collection
        }),
        endpoints: [
          ...(incomingConfig.endpoints ?? []),
          pluginEndpoints.textarea,
          pluginEndpoints.upload,
          pluginEndpoints.chat,
          fetchFields(pluginConfig),
        ],
        globals: globals.map((global) => {
          if (globalsSlugs && globalsSlugs[global.slug]) {
            const { schemaPathMap, updatedCollectionConfig } = updateFieldsConfig(global)
            collectionsFieldPathMap = {
              ...collectionsFieldPathMap,
              ...schemaPathMap,
            }
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
      if (incomingConfig.onInit) await incomingConfig.onInit(payload)

      if (!isActivated) {
        payload.logger.warn(`— AI Plugin: Not activated. Please verify your environment keys.`)
        return
      }

        await init(payload, collectionsFieldPathMap, pluginConfig)
          .catch((error) => {
            payload.logger.error(error, `— AI Plugin: Initialization Error`)
          })
          .finally(() => {
            if (!pluginConfig.disableSponsorMessage) {
              setTimeout(() => {
                payload.logger.info(securityMessage)
              }, 1000)
              setTimeout(() => {
                payload.logger.info(sponsorMessage)
              }, 3000)
            }
          })
      }

    return updatedConfig
  }

export { payloadAiPlugin }
