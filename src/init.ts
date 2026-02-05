import type { Payload } from 'payload'

import type { PluginConfig } from './types.js'

import { defaultSeedPrompts } from './ai/prompts.js'
import { systemGenerate } from './ai/utils/systemGenerate.js'
import { PLUGIN_INSTRUCTIONS_TABLE } from './defaults.js'

// Defined capabilities mapping for init
const CAPABILITY_MAP = [
  { id: 'text', fields: ['text', 'textarea'] },
  { id: 'richtext', fields: ['richText'] },
  { id: 'image', fields: ['upload'] },
  { id: 'array', fields: ['array'] },
  // TTS usually outputs to upload, but init logic maps field types to capabilities
]

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

  // Get all instructions for faster initialization
  const { docs: allInstructions } = await payload.find({
    collection: PLUGIN_INSTRUCTIONS_TABLE,
    depth: 0,
    pagination: false,
    select: {
      'field-type': true,
      'model-id': true,
      'schema-path': true,
    },
  })

  const fieldInstructionsMap: Record<string, { fieldType: any; id: any }> = {}

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]
    const { type: fieldType, label: fieldLabel, relationTo } = fieldSchemaPaths[path]
    let instructions = allInstructions.find((entry) => entry['schema-path'] === path)

    if (!instructions) {
      let seed
      const seedOptions = {
        fieldLabel,
        fieldSchemaPaths,
        fieldType,
        path,
      }

      if (pluginConfig.seedPrompts) {seed = await pluginConfig.seedPrompts(seedOptions)}
      if (seed === undefined) {seed = await defaultSeedPrompts(seedOptions)}
      // Field should be ignored
      if (!seed) {
        if (pluginConfig.debugging) {
          payload.logger.info(`— AI Plugin: No seed prompt for ${path}, ignoring...`)
        }
        continue
      }

      // Empty prompt - smart fallback will generate a contextual prompt at runtime
      const generatedPrompt: string | undefined = ''
      if ('prompt' in seed) {
        // Prompt generation currently disabled during migration to AI SDK Providers
        // TODO: Re-enable using a default provider from AI Settings if available
        /*
        generatedPrompt = await systemGenerate(
          {
            prompt: seed.prompt,
            system: seed.system,
          },
          undefined // No generateTextFn currently
        )
        */
      }

      const modelForId = CAPABILITY_MAP.find((a) => a.fields.includes(fieldType))

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
        })
        .catch((err) => {
          payload.logger.error(err, '— AI Plugin: Error creating Compose settings-')
        })) as (typeof allInstructions)[0]

      if (instructions?.id) {
        fieldInstructionsMap[path] = {
          id: instructions.id,
          fieldType,
        }
      }
    } else {
      const modelForId = CAPABILITY_MAP.find((a) => a.fields.includes(fieldType))

      if (instructions['field-type'] !== fieldType || !instructions['model-id']) {
        payload.logger.warn(
          `— AI Plugin: Field config mismatch for ${path}! Updating...`,
        )
        const updateData: any = {
           'field-type': fieldType,
        }
        
        // Only set model-id if it's missing or we have a better default
        if (!instructions['model-id'] && modelForId?.id) {
           updateData['model-id'] = modelForId.id
        }
        
        await payload.update({
          id: instructions.id,
          collection: PLUGIN_INSTRUCTIONS_TABLE,
          data: updateData,
        })
        instructions['field-type'] = fieldType
        if (updateData['model-id']) {
          instructions['model-id'] = updateData['model-id']
        }
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
