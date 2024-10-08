import type { Payload } from 'payload'

import type { PluginConfig } from './types.js'

import { GenerationModels } from './ai/models/index.js'
import { seedPrompts } from './ai/prompts.js'
import { systemGenerate } from './ai/utils/systemGenerate.js'
import { PLUGIN_INSTRUCTIONS_TABLE } from './defaults.js'

export const init = async (payload: Payload, fieldSchemaPaths, pluginConfig: PluginConfig) => {
  payload.logger.info(`— AI Plugin: Initializing...`)

  const paths = Object.keys(fieldSchemaPaths)

  const fieldInstructionsMap = {}
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
        generatedPrompt = await systemGenerate({
          prompt,
          system,
        })
        payload.logger.info(
          `\nPrompt generated for "${fieldLabel}" field:\nprompt: ${generatedPrompt}\n\n`,
        )
      }

      const instructions = await payload
        .create({
          collection: PLUGIN_INSTRUCTIONS_TABLE,
          data: {
            'field-type': fieldType,
            'model-id': GenerationModels.find((a) => {
              return a.fields.includes(fieldType)
            })?.id,
            prompt: generatedPrompt,
            'relation-to': relationTo,
            'schema-path': path,
          },
        })
        .then((a) => a)
        .catch((err) => {
          console.log('— AI Plugin: Error creating Compose settings-', err)
        })

      // @ts-expect-error
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
  }

  payload.logger.info(`— AI Plugin: Initialized!`)
  if (pluginConfig.generatePromptOnInit) {
    payload.logger.info(
      '\n\n-AI Plugin: Example prompts are added to get you started, Now go break some code 🚀🚀🚀\n\n',
    )
  }
}
