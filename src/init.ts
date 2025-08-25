import type { Payload } from 'payload'

import type { PluginConfig } from './types.js'

import { seedPrompts } from './ai/prompts.js'
import { systemGenerate } from './ai/utils/systemGenerate.js'
import { PLUGIN_INSTRUCTIONS_TABLE } from './defaults.js'
import { getGenerationModels } from './utilities/getGenerationModels.js'

export const init = async (
  payload: Payload,
  fieldSchemaPaths: Record<string, { label: string; relationTo?: string; type: string }>,
  pluginConfig: PluginConfig,
) => {
  if (pluginConfig.debugging) {
    payload.logger.info(`— AI Plugin: Initializing...`)
  }

  const paths = Object.keys(fieldSchemaPaths)

  const fieldInstructionsMap: Record<string, { fieldType: any; id: any }> = {}
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]
    const { type: fieldType, label: fieldLabel, relationTo } = fieldSchemaPaths[path]
    const entry = await payload.find({
      collection: PLUGIN_INSTRUCTIONS_TABLE,
      pagination: false,
      where: {
        'field-type': {
          equals: fieldType,
        },
        'schema-path': {
          equals: path,
        },
      },
    })

    if (!entry?.docs?.length) {
      const { prompt, system } = seedPrompts({
        fieldLabel,
        fieldSchemaPaths,
        fieldType,
        path,
      })

      let generatedPrompt = '{{ title }}'
      if (pluginConfig.generatePromptOnInit) {
        // find the model that has the generateText function
        const models = getGenerationModels(pluginConfig)
        const model =
          models && Array.isArray(models) ? models.find((model) => model.generateText) : undefined
        generatedPrompt = await systemGenerate(
          {
            prompt,
            system,
          },
          model?.generateText,
        )
        payload.logger.info(
          `\nPrompt generated for "${fieldLabel}" field:\nprompt: ${generatedPrompt}\n\n`,
        )
      }

      const modelsForId = getGenerationModels(pluginConfig)
      const modelForId =
        modelsForId && Array.isArray(modelsForId)
          ? modelsForId.find((a) => a.fields.includes(fieldType))
          : undefined

      const instructions = await payload
        .create({
          collection: PLUGIN_INSTRUCTIONS_TABLE,
          data: {
            'field-type': fieldType,
            'model-id': modelForId?.id,
            prompt: generatedPrompt,
            'relation-to': relationTo,
            'schema-path': path,
          },
        })
        .then((a) => a)
        .catch((err) => {
          payload.logger.error('— AI Plugin: Error creating Compose settings-', err)
        })

      if (instructions?.id) {
        fieldInstructionsMap[path] = {
          id: instructions.id,
          fieldType,
        }
      }
    } else {
      const [instructions] = entry.docs
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
