import type { Config } from 'payload'

import { deepMerge } from 'payload/shared'

import type { AIPluginConfig } from './types.js'

import { Instructions } from './collections/Instructions.js'
import { endpoints } from './endpoints/index.js'
import { translations } from './translations/index.js'

import { AIRichTextLabel } from './fields/RichTextLabel/index.js';
import { AITextarea } from './fields/Textarea/index.js'
import { AIUpload } from './fields/Upload/index.js'
import { SmartLabel } from './fields/SmartLabel/index.js'
import { updateFieldsConfig } from './utilities/updateFieldsConfig.js'

const aiPlugin =
  (pluginConfig: AIPluginConfig) =>
  async (incomingConfig: Config): Promise<Config> => {
    const collections = [...(incomingConfig.collections ?? []), Instructions]
    const {collections: collectionSlugs = []} = pluginConfig
    const updatedConfig: Config = {
      ...incomingConfig,
      collections: collections.map(collection =>
        collectionSlugs.indexOf(collection.slug) > -1
          ? updateFieldsConfig(collection, { components: { Label: SmartLabel({}) } })
          : collection
      ),
      endpoints: [...(incomingConfig.endpoints ?? []), endpoints.textarea, endpoints.upload],
      i18n: {
        ...incomingConfig.i18n,
        translations: {
          ...deepMerge(translations, incomingConfig.i18n?.translations),
        },
      },
    }

    // Add additional onInit code by using the onInitExtension function
    // onInitExtension(pluginOptions, payload);
    // };

    return updatedConfig
  }

export {
    AITextarea,
    AIUpload,
    aiPlugin,
    AIRichTextLabel,
    SmartLabel
}
