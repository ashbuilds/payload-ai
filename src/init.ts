export const init = async (payload, fieldSchemaPaths) => {
  payload.logger.info(`— AI Plugin: Initializing...`)

  const paths = Object.keys(fieldSchemaPaths)

  const fieldInstructionsMap = {}
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i]
    const fieldType = fieldSchemaPaths[path]
    const entry = await payload.find({
      collection: 'instructions',
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
        collection: 'instructions',
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

  await payload.updateGlobal({
    slug: 'ai-plugin__instructions_map', // required
    data: {
      map: fieldInstructionsMap,
    },
    depth: 2,
  })
  payload.logger.info(`— AI Plugin: Initialized!`)
}
