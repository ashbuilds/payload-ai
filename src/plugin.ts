import type { Config } from 'payload'

import { deepMerge } from 'payload/shared'
import { zodToJsonSchema } from 'zod-to-json-schema'

import type { PluginConfig } from './types.js'

import { lexicalSchema } from './ai/schemas/lexical.schema.js'
import { Instructions } from './collections/Instructions.js'
import { PLUGIN_INSTRUCTIONS_MAP_GLOBAL, PLUGIN_NAME } from './defaults.js'
import { endpoints } from './endpoints/index.js'
import { init } from './init.js'
import { translations } from './translations/index.js'
import { isPluginActivated } from './utilities/isPluginActivated.js'
import { updateFieldsConfig } from './utilities/updateFieldsConfig.js'
import { Automations } from './collections/Automations.js'

const defaultPluginConfig: PluginConfig = {
  collections: {},
  generatePromptOnInit: true,
}

const payloadAiPlugin =
  (pluginConfig: PluginConfig) =>
  (incomingConfig: Config): Config => {
    pluginConfig = { ...defaultPluginConfig, ...pluginConfig }
    const isActivated = isPluginActivated()
    let updatedConfig: Config = { ...incomingConfig }
    let collectionsFieldPathMap = {}

    if (isActivated) {
      // Inject editor schema to config, so that it can be accessed when /textarea endpoint will hit
      const zodLexicalSchema = lexicalSchema(pluginConfig.editorConfig?.nodes)

      if (pluginConfig.debugging) {
        Instructions.admin.hidden = false
      }

      Instructions.admin.custom = {
        ...(Instructions.admin.custom || {}),
        [PLUGIN_NAME]: {
          editorConfig: {
            // Used in admin client for useObject hook
            schema: zodToJsonSchema(zodLexicalSchema),
          },
        },
      }

      Instructions.custom = {
        ...(Instructions.custom || {}),
        [PLUGIN_NAME]: {
          editorConfig: {
            // Used in textarea endpoint for llm
            schema: zodLexicalSchema,
          },
        },
      }

      const collections = [...(incomingConfig.collections ?? []), Instructions]
      const { collections: collectionSlugs = [] } = pluginConfig

      const { components: { providers = [] } = {} } = incomingConfig.admin || {}
      const updatedProviders = [
        ...(providers ?? []),
        {
          clientProps: {},
          path: '@ai-stack/payloadcms/client#InstructionsProvider',
          serverProps: {},
        },
      ]

      incomingConfig.admin = {
        ...(incomingConfig.admin || {}),
        components: {
          ...(incomingConfig.admin?.components ?? {}),
          providers: updatedProviders,
        },
      }

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
        endpoints: [...(incomingConfig.endpoints ?? []), endpoints.textarea, endpoints.upload],
        globals: [
          ...(incomingConfig.globals || []),
          {
            slug: PLUGIN_INSTRUCTIONS_MAP_GLOBAL,
            access: {
              read: () => true,
            },
            admin: {
              hidden: !pluginConfig.debugging,
            },
            fields: [
              {
                name: 'map',
                type: 'json',
              },
            ],
          },
        ],
        i18n: {
          ...(incomingConfig.i18n || {}),
          translations: {
            ...deepMerge(translations, incomingConfig.i18n?.translations),
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

      await init(payload, collectionsFieldPathMap, pluginConfig).catch((error) => {
        console.error(error)
        payload.logger.error(`— AI Plugin: Initialization Error: ${error}`)
      })
    }

    return updatedConfig
  }

export { payloadAiPlugin }
