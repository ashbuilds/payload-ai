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

const aiPlugin =
  (pluginConfig: AIPluginConfig) =>
  async (incomingConfig: Config): Promise<Config> => {
    //TODO: Remove this mess, find alternative
    try {
      for (const [index, field] of Instructions.fields.entries()) {
        const customOptions = field.admin?.custom?.getOptions
        if (typeof customOptions === 'function') {
          Instructions.fields[index].admin.custom.options = await customOptions()
        }

        if (field.type === 'group') {
          for (const [groupIndex, groupField] of field.fields.entries()) {
            const customOptions = groupField.admin?.custom?.getOptions
            if (typeof customOptions === 'function') {
              field.fields[groupIndex].admin.custom.options = await customOptions()
            }
          }
        }
      }
    } catch (e) {
      console.error('Error while running getOptions: ', e)
    }

    const collections = [...(incomingConfig.collections ?? []), Instructions]

    const updatedConfig: Config = {
      ...incomingConfig,
      collections:
        collections?.map((collection) => {
          const { slug } = collection

          return collection
        }) || [],
      endpoints: [...(incomingConfig.endpoints ?? []), endpoints.textarea, endpoints.upload],
      i18n: {
        ...incomingConfig.i18n,
        translations: {
          ...deepMerge(translations, incomingConfig.i18n?.translations),
        },
      },
    }

    // objectScan(['**.admin.custom.options'], {
    //   filterFn: async (objValue) => {
    //     const options = objValue.value
    //     if (typeof options === 'function') {
    //       console.log('objValue ----> ', objValue)
    //       const gParent = objValue.parents
    //       const p = gParent[objValue.parents.length - 2]
    //       // const ggParent = gParent.getGparent()
    //       console.log('ggParent ----> ', p)
    //       const data = await options()
    //       console.log('data ---> ', data)
    //     }
    //   },
    // })(updatedConfig.collections)

    // updatedConfig.onInit = async (payload) => {
    //   if (incomingConfig.onInit) await incomingConfig.onInit(payload);

    // let collection: CollectionConfig;
    // incomingConfig.collections?.forEach((collection) => {
    //   // console.log('collection', collection);
    //   // console.log('collection', collection.fields);
    //   objectScan(['**.Field'], {
    //     filterFn: async (objValue) => {
    //       const func = objValue.value;
    //
    //       if (typeof func === 'function') {
    //         const [, , fieldConfig] = objValue.parents;
    //
    //         const { docs = [] } = await payload.find({
    //           collection: 'instructions',
    //           where: {
    //             'collection-slug': {
    //               equals: collection.slug,
    //             },
    //             'field-path': {
    //               equals: fieldConfig.name,
    //             },
    //           },
    //         });
    //         console.log('docs', docs);
    //       }
    //     },
    //   })(collection.fields);
    // });

    // Add additional onInit code by using the onInitExtension function
    // onInitExtension(pluginOptions, payload);
    // };

    // updatedConfig.

    return updatedConfig
  }

export {
    AITextarea,
    AIUpload,
    aiPlugin,
    AIRichTextLabel,
    SmartLabel
}
