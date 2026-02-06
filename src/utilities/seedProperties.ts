import type { PayloadRequest } from 'payload'

import { defaultSeedPrompts } from '../ai/prompts.js'
import { PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js'
import { updateFieldsConfig } from './updateFieldsConfig.js'

interface SeedPropertiesArgs {
  enabledCollections: string[]
  req: PayloadRequest
}

export const seedProperties = async ({ enabledCollections, req }: SeedPropertiesArgs): Promise<void> => {
  const { payload } = req

  if (!enabledCollections || enabledCollections.length === 0) {
    return
  }

  // Get all collections from payload config
  const allCollections = payload.config.collections

  for (const collectionSlug of enabledCollections) {
    const collectionConfig = allCollections.find((c) => c.slug === collectionSlug)
    if (!collectionConfig) {
      continue
    }

    // Traverse the collection config effectively using updateFieldsConfig
    // Use the side-effect of getting schemaPathMap from it
    const { schemaPathMap } = updateFieldsConfig(collectionConfig)

    for (const [schemaPath, fieldInfo] of Object.entries(schemaPathMap)) {
      const { label, relationTo, type } = fieldInfo as {
        label: string
        relationTo?: string
        type: string
      }

      // Check if instruction already exists
      const existingInstruction = await payload.find({
        collection: PLUGIN_INSTRUCTIONS_TABLE,
        depth: 0,
        limit: 1,
        where: {
          'schema-path': {
            equals: schemaPath,
          },
        },
      })

      if (existingInstruction.totalDocs > 0) {
        continue
      }

      // Generate seed prompts
      const { prompt, system } = defaultSeedPrompts({
        fieldLabel: label,
        fieldSchemaPaths: {}, // We might not need the full map here for individual seeding
        fieldType: type,
        path: schemaPath,
      })

      // Determine model-id based on field type
      let modelId = 'text'
      if (type === 'richText') {modelId = 'richtext'}
      if (type === 'upload') {modelId = 'image'} // defaulting to image generation for uploads
      if (type === 'array') {modelId = 'array'}

      // Create new instruction
      try {
        await payload.create({
          collection: PLUGIN_INSTRUCTIONS_TABLE,
          data: {
            'ai-prompts-tabs': {
              prompt,
              system,
            },
           'field-type': type,
           'model-id': modelId,
           'relation-to': relationTo,
           'schema-path': schemaPath,
           'disabled': false,
          },
        })
      } catch (error) {
        payload.logger.error(`Failed to seed instruction for ${schemaPath}: ${error}`)
      }
    }
  }
}
