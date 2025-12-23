import type { Payload } from 'payload'

import type { PluginConfig } from './types.js'

import { defaultSeedPrompts } from './ai/prompts.js'
import { systemGenerate } from './ai/utils/systemGenerate.js'
import { PLUGIN_INSTRUCTIONS_TABLE } from './defaults.js'
import { getGenerationModels } from './utilities/getGenerationModels.js'

export const init = async (
  payload: Payload,
  fieldSchemaPaths: Record<string, { label: string; relationTo?: string; type: string }>,
  pluginConfig: PluginConfig,
) => {
  if (!pluginConfig.generatePromptOnInit) {
    return
  }

  if (pluginConfig.debugging) {
    payload.logger.info(`— AI Plugin: Initializing...`)
  }

  const paths = Object.keys(fieldSchemaPaths)

  // Check if localization is enabled from plugin config
  const isLocalized =
    pluginConfig._localization?.enabled && pluginConfig._localization.locales.length > 0
  const locales = pluginConfig._localization?.locales || []

  // Get all instructions for faster initialization
  // If localized, we need to check each locale separately
  const allInstructionsByLocale: Record<string, Array<Record<string, unknown>>> = {}

  if (isLocalized) {
    // Fetch instructions for each locale
    for (const localeCode of locales) {
      const { docs } = await payload.find({
        collection: PLUGIN_INSTRUCTIONS_TABLE,
        depth: 0,
        locale: localeCode,
        pagination: false,
        select: {
          'field-type': true,
          'schema-path': true,
        },
      })
      allInstructionsByLocale[localeCode] = docs
    }
  } else {
    // Non-localized: fetch all instructions once
    const { docs } = await payload.find({
      collection: PLUGIN_INSTRUCTIONS_TABLE,
      depth: 0,
      pagination: false,
      select: {
        'field-type': true,
        'schema-path': true,
      },
    })
    allInstructionsByLocale['default'] = docs
  }

  const fieldInstructionsMap: Record<string, { fieldType: unknown; id: unknown }> = {}

  const localesToProcess = isLocalized ? locales : ['default']

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]
    const { type: fieldType, label: fieldLabel, relationTo } = fieldSchemaPaths[path]

    for (const localeCode of localesToProcess) {
      const allInstructions = allInstructionsByLocale[localeCode] || []
      let instructions = allInstructions.find(
        (entry: Record<string, unknown>) => entry['schema-path'] === path,
      )

      if (!instructions) {
        let seed
        const seedOptions = {
          fieldLabel,
          fieldSchemaPaths,
          fieldType,
          path,
        }

        if (pluginConfig.seedPrompts) {
          seed = await pluginConfig.seedPrompts(seedOptions)
        }
        if (seed === undefined) {
          seed = await defaultSeedPrompts(seedOptions)
        }
        // Field should be ignored
        if (!seed) {
          if (pluginConfig.debugging) {
            payload.logger.info(`— AI Plugin: No seed prompt for ${path}, ignoring...`)
          }
          continue
        }

        let generatedPrompt = '{{ title }}'
        if ('prompt' in seed) {
          // find the model that has the generateText function
          const models = getGenerationModels(pluginConfig)
          const model =
            models && Array.isArray(models) ? models.find((model) => model.generateText) : undefined
          generatedPrompt = await systemGenerate(
            {
              prompt: seed.prompt,
              system: seed.system,
            },
            model?.generateText,
          )
        }

        const modelsForId = getGenerationModels(pluginConfig)
        const modelForId =
          modelsForId && Array.isArray(modelsForId)
            ? modelsForId.find((a) => a.fields.includes(fieldType))
            : undefined

        const data = {
          'model-id': modelForId?.id,
          prompt: generatedPrompt,
          ...seed.data, // allow to override data, but not the one below
          'field-type': fieldType,
          'relation-to': relationTo,
          'schema-path': path,
        }

        payload.logger.info(
          {
            'model-id': data['model-id'],
            prompt: generatedPrompt,
            ...seed.data,
          },
          `Prompt seeded for "${path}" field`,
        )

        instructions = (await payload
          .create({
            collection: PLUGIN_INSTRUCTIONS_TABLE,
            data,
            locale: isLocalized && localeCode !== 'default' ? localeCode : undefined,
          })
          .catch((err: unknown) => {
            payload.logger.error(
              err,
              `— AI Plugin: Error creating Compose settings for ${path}${isLocalized && localeCode !== 'default' ? ` (locale: ${localeCode})` : ''}-`,
            )
          })) as (typeof allInstructions)[0]

        if (instructions?.id) {
          const mapKey = isLocalized ? `${path}:${localeCode}` : path
          fieldInstructionsMap[mapKey] = {
            id: instructions.id,
            fieldType,
          }
        }
      } else {
        if (instructions['field-type'] !== fieldType) {
          payload.logger.warn(
            `— AI Plugin: Field type mismatch for ${path}${isLocalized ? ` (locale: ${localeCode})` : ''}! Was "${fieldType}", it is "${instructions['field-type']}" now. Updating...`,
          )
          await payload.update({
            id: instructions.id as number | string,
            collection: PLUGIN_INSTRUCTIONS_TABLE,
            data: {
              'field-type': fieldType,
            },
            locale: isLocalized && localeCode !== 'default' ? localeCode : undefined,
          })
          instructions['field-type'] = fieldType
        }

        const mapKey = isLocalized ? `${path}:${localeCode}` : path
        fieldInstructionsMap[mapKey] = {
          id: instructions.id,
          fieldType,
        }
      }
    }
  }

  if (pluginConfig.debugging) {
    payload.logger.info(
      `— AI Plugin: Enabled fields map: ${JSON.stringify(fieldInstructionsMap, null, 2)}`,
    )
    payload.logger.info(`— AI Plugin: Initialized!`)
  }

  if (pluginConfig.generatePromptOnInit) {
    payload.logger.info(
      '\n\n-AI Plugin: Example prompts are added to get you started, Now go break some code 🚀🚀🚀\n\n',
    )
  }
}
