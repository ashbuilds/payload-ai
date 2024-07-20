import type { Config } from 'payload'
import { deepMerge } from 'payload/shared'

import { Instructions } from './collections/Instructions.js'
import { endpoints } from './endpoints/index.js'
import { init } from './init.js'
import { InstructionsProvider } from './providers/InstructionsProvider/InstructionsProvider.js'
import { translations } from './translations/index.js'
import type { PluginConfig } from './types.js'
import { updateFieldsConfig } from './utilities/updateFieldsConfig.js'

const payloadAiPlugin =
  (pluginConfig: PluginConfig) =>
  async (incomingConfig: Config): Promise<Config> => {
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
          const { updatedCollectionConfig, schemaPathMap } = updateFieldsConfig(collection)
          collectionsFieldPathMap = {
            ...collectionsFieldPathMap,
            ...schemaPathMap,
          }
          return updatedCollectionConfig
        }

        return collection
      }),
      endpoints: [...(incomingConfig.endpoints ?? []), endpoints.textarea, endpoints.upload],
      i18n: {
        ...incomingConfig.i18n,
        translations: {
          ...deepMerge(translations, incomingConfig.i18n?.translations),
        },
      },
      globals: [
        ...incomingConfig.globals,
        {
          slug: 'ai-plugin__instructions_map',
          fields: [
            {
              type: 'json',
              name: 'map',
            },
          ],
          admin: {
            hidden: true,
          },
          access: {
            read: () => true,
          },
        },
      ],
    }

    updatedConfig.onInit = async (payload) => {
      if (incomingConfig.onInit) await incomingConfig.onInit(payload)

      init(payload, collectionsFieldPathMap)
    }

    return updatedConfig
  }

export { payloadAiPlugin }
