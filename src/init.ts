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

  // Note: schema-path is globally unique, so we create one entry per path regardless of localization
  // Localization info is kept for potential future use or debugging
  const _isLocalized =
    pluginConfig._localization?.enabled && pluginConfig._localization.locales.length > 0
  const _locales = pluginConfig._localization?.locales || []

  // Get all instructions for faster initialization
  // Query with locale: 'all' to get entries from all locales when localization is enabled
  const { docs: allInstructions } = await payload.find({
    collection: PLUGIN_INSTRUCTIONS_TABLE,
    depth: 0,
    locale: 'all',
    pagination: false,
    select: {
      id: true,
      'field-type': true,
      'schema-path': true,
    },
  })

  const fieldInstructionsMap: Record<string, { fieldType: string; id: number | string }> = {}

  type InstructionDoc = (typeof allInstructions)[0]

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]
    const { type: fieldType, label: fieldLabel, relationTo } = fieldSchemaPaths[path]
    // Find existing entry for this path (schema-path is globally unique, not per locale)
    let instructions: InstructionDoc | undefined = allInstructions.find(
      (entry) => entry['schema-path'] === path,
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

      try {
        instructions = (await payload.create({
          collection: PLUGIN_INSTRUCTIONS_TABLE,
          data,
        })) as InstructionDoc
      } catch (err: unknown) {
        // Handle unique constraint violation - entry might already exist for another locale
        const error = err as { data?: { errors?: Array<{ path?: string }> }; name?: string }
        if (
          error?.name === 'ValidationError' &&
          error?.data?.errors?.some((e) => e.path === 'schema-path')
        ) {
          // Try to find the existing entry across all locales
          const { docs } = await payload.find({
            collection: PLUGIN_INSTRUCTIONS_TABLE,
            limit: 1,
            locale: 'all',
            select: {
              id: true,
              'field-type': true,
              'schema-path': true,
            },
            where: {
              'schema-path': {
                equals: path,
              },
            },
          })

          const existingEntry = docs[0] as InstructionDoc | undefined
          if (existingEntry) {
            instructions = existingEntry
            if (pluginConfig.debugging) {
              payload.logger.info(
                `— AI Plugin: Entry already exists for ${path}, using existing entry`,
              )
            }
          } else {
            payload.logger.error(err, `— AI Plugin: Error creating Compose settings for ${path}`)
          }
        } else {
          payload.logger.error(err, `— AI Plugin: Error creating Compose settings for ${path}`)
        }
      }

      if (instructions?.id) {
        fieldInstructionsMap[path] = {
          id: instructions.id,
          fieldType,
        }
      }
    } else {
      if (instructions['field-type'] !== fieldType) {
        const currentFieldType = instructions['field-type'] as string
        payload.logger.warn(
          `— AI Plugin: Field type mismatch for ${path}! Was "${fieldType}", it is "${currentFieldType}" now. Updating...`,
        )
        await payload.update({
          id: instructions.id,
          collection: PLUGIN_INSTRUCTIONS_TABLE,
          data: {
            'field-type': fieldType,
          },
        })
        instructions['field-type'] = fieldType
      }

      fieldInstructionsMap[path] = {
        id: instructions.id,
        fieldType,
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
