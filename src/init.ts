import type { Payload } from 'payload'

import { PLUGIN_INSTRUCTIONS_MAP_GLOBAL, PLUGIN_INSTRUCTIONS_TABLE } from './defaults.js'

export const init = async (payload: Payload, fieldSchemaPaths) => {
  payload.logger.info(`— AI Plugin: Initializing...`)

  const paths = Object.keys(fieldSchemaPaths)

  const fieldInstructionsMap = {}
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]
    const fieldType = fieldSchemaPaths[path]
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
      const instructions = await payload.create({
        collection: PLUGIN_INSTRUCTIONS_TABLE,
        data: {
          'field-type': fieldType,
          'schema-path': path,
        },
      })
      fieldInstructionsMap[path] = instructions.id
    } else {
      const [instructions] = entry.docs
      fieldInstructionsMap[path] = instructions.id
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
}
