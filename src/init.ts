import type { Payload } from 'payload'

import { GenerationModels } from './ai/models/index.js'
import { seedPrompts } from './ai/prompts.js'
import { generateSeedPrompt } from './ai/utils/generateSeedPrompt.js'
import { PLUGIN_INSTRUCTIONS_MAP_GLOBAL, PLUGIN_INSTRUCTIONS_TABLE } from './defaults.js'

export const init = async (payload: Payload, fieldSchemaPaths) => {
  payload.logger.info(`— AI Plugin: Initializing...`)

  const paths = Object.keys(fieldSchemaPaths)

  const fieldInstructionsMap = {}
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]
    const { type: fieldType, label: fieldLabel } = fieldSchemaPaths[path]
    //TODO: if global is broken the plugin doesn't know and does not run reindexing
    const entry = await payload.find({
      collection: PLUGIN_INSTRUCTIONS_TABLE,
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
      const generatedPrompt = await generateSeedPrompt({
        prompt,
        system,
      })
      payload.logger.info(
        `\nPrompt generated for "${fieldLabel}" field:\nprompt: ${generatedPrompt}\n\n`,
      )
      const instructions = await payload
        .create({
          collection: PLUGIN_INSTRUCTIONS_TABLE,
          data: {
            'field-type': fieldType,
            'model-id': GenerationModels.find((a) => {
              return a.fields.includes(fieldType)
            })?.id,
            prompt: generatedPrompt,
            'schema-path': path,
          },
        })
        .then((a) => a)
        .catch((a) => {
          console.log('err-', a)
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

  payload.logger.info(
    `— AI Plugin: Enabled fieldMap: ${JSON.stringify(fieldInstructionsMap, null, 2)}`,
  )
  await payload.updateGlobal({
    slug: PLUGIN_INSTRUCTIONS_MAP_GLOBAL, // required
    data: {
      map: fieldInstructionsMap,
    },
    depth: 2,
  })

  payload.logger.info(`— AI Plugin: Initialized!`)
  payload.logger.info(
    '\n\n-AI Plugin: Example prompts are added to get you started, Now go break some code 🚀🚀🚀\n\n',
  )
}
