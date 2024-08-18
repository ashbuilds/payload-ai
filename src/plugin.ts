import type { Config } from 'payload'

import { deepMerge } from 'payload/shared'

import type { PluginConfig } from './types.js'

import { Instructions } from './collections/Instructions.js'
import { PLUGIN_INSTRUCTIONS_MAP_GLOBAL } from './defaults.js'
import { endpoints } from './endpoints/index.js'
import { init } from './init.js'
import { InstructionsProvider } from './providers/InstructionsProvider/index.js'
import { translations } from './translations/index.js'
import { updateFieldsConfig } from './utilities/updateFieldsConfig.js'

const payloadAiPlugin =
  (pluginConfig: PluginConfig) =>
  (incomingConfig: Config): Config => {
    const collections = [...(incomingConfig.collections ?? []), Instructions]
    const { collections: collectionSlugs = [] } = pluginConfig

    let collectionsFieldPathMap = {}

    incomingConfig.admin.components.providers = [
      ...(incomingConfig.admin.components.providers ?? []),
      InstructionsProvider,
    ]

    const updatedConfig: Config = {
      ...incomingConfig,
      collections: collections.map((collection) => {
        if (collectionSlugs.indexOf(collection.slug) > -1) {
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
        ...incomingConfig.globals,
        {
          slug: PLUGIN_INSTRUCTIONS_MAP_GLOBAL,
          access: {
            read: () => true,
          },
          admin: {
            hidden: false,
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
        ...incomingConfig.i18n,
        translations: {
          ...deepMerge(translations, incomingConfig.i18n?.translations),
        },
      },
    }

    updatedConfig.onInit = async (payload) => {
      if (incomingConfig.onInit) await incomingConfig.onInit(payload)

      await init(payload, collectionsFieldPathMap).catch((error) => {
        payload.logger.error(`— AI Plugin: Initialization Error: ${error}`)
      })
    }

    return updatedConfig
  }

export { payloadAiPlugin }
