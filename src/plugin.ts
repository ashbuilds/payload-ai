import type { Config } from 'payload'

import { deepMerge } from 'payload/shared'

import type { PluginConfig } from './types.js'

import { lexicalJsonSchema } from './ai/schemas/lexicalJsonSchema.js'
import { instructionsCollection } from './collections/Instructions.js'
import { PLUGIN_NAME } from './defaults.js'
import { fetchFields } from './endpoints/fetchFields.js'
import { endpoints } from './endpoints/index.js'
import { init } from './init.js'
import { translations } from './translations/index.js'
import { isPluginActivated } from './utilities/isPluginActivated.js'
import { updateFieldsConfig } from './utilities/updateFieldsConfig.js'
import { defaultGenerationModels } from './ai/models/index.js'
import { getGenerationModels } from './utilities/getGenerationModels.js'

const defaultPluginConfig: PluginConfig = {
  collections: {},
  disableSponsorMessage: false,
  generatePromptOnInit: true,
  generationModels: defaultGenerationModels
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

const payloadAiPlugin =
  (pluginConfig: PluginConfig) =>
  (incomingConfig: Config): Config => {
    pluginConfig = { ...defaultPluginConfig, ...pluginConfig }
    pluginConfig.generationModels = getGenerationModels(pluginConfig)
    const isActivated = isPluginActivated(pluginConfig)
    let updatedConfig: Config = { ...incomingConfig }
    let collectionsFieldPathMap = {}
    if (isActivated) {
      const Instructions = instructionsCollection(pluginConfig)
      // Inject editor schema to config, so that it can be accessed when /textarea endpoint will hit
      const lexicalSchema = lexicalJsonSchema(pluginConfig.editorConfig?.nodes)

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
      const { collections: collectionSlugs = [] } = pluginConfig

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
          if (collectionSlugs[collection.slug]) {
            const { schemaPathMap, updatedCollectionConfig } = updateFieldsConfig(collection)
            collectionsFieldPathMap = {
              ...collectionsFieldPathMap,
              ...schemaPathMap,
            }
            return updatedCollectionConfig
          }

          return collection
        }),
        endpoints: [
          ...(incomingConfig.endpoints ?? []),
          pluginEndpoints.textarea,
          pluginEndpoints.upload,
          fetchFields,
        ],
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
          console.error(error)
          payload.logger.error(`— AI Plugin: Initialization Error: ${error}`)
        })
        .finally(() => {
          if (!pluginConfig.disableSponsorMessage) {
            setTimeout(() => {
              payload.logger.info(sponsorMessage)
            }, 3000)
          }
        })
    }

    return updatedConfig
  }

export { payloadAiPlugin }
