import type { PayloadRequest } from 'payload'

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
      const { type, custom, relationTo } = fieldInfo as {
        custom?: { ai?: { prompt?: string; system?: string } }
        relationTo?: string
        type: string
      }

      // Check if instruction already exists
      const existingInstruction = await payload.find({
        collection: PLUGIN_INSTRUCTIONS_TABLE,
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: {
          'schema-path': {
            equals: schemaPath,
          },
        },
      })

      if (existingInstruction.totalDocs > 0) {
        // If developer has provided custom prompts in the schema, update the existing record
        // but only if the values have actually changed.
        if (custom?.ai?.prompt || custom?.ai?.system) {
          const doc = existingInstruction.docs[0] as any
          const currentPrompt = doc.prompt
          const currentSystem = doc.system

          let needsUpdate = false
          const updateData: any = {}

          if (custom?.ai?.prompt && custom.ai.prompt !== currentPrompt) {
            updateData.prompt = custom.ai.prompt
            needsUpdate = true
          }
          if (custom?.ai?.system && custom.ai.system !== currentSystem) {
            updateData.system = custom.ai.system
            needsUpdate = true
          }

          if (needsUpdate) {
            try {
              await payload.update({
                id: doc.id,
                collection: PLUGIN_INSTRUCTIONS_TABLE,
                data: updateData,
                overrideAccess: true,
              })
            } catch (error) {
              payload.logger.error(`Failed to update instruction for ${schemaPath}: ${error}`)
            }
          }
        }
        continue
      }

      // Use custom prompts if provided, otherwise leave empty
      const prompt = custom?.ai?.prompt || ''
      const system = custom?.ai?.system || ''

      // Determine model-id based on field type
      let modelId = 'text'
      if (type === 'richText') {
        modelId = 'richtext'
      }
      if (type === 'upload') {
        modelId = 'image'
      } // defaulting to image generation for uploads
      if (type === 'array') {
        modelId = 'array'
      }

      // Create new instruction
      try {
        await payload.create({
          collection: PLUGIN_INSTRUCTIONS_TABLE,
          data: {
            disabled: false,
            'field-type': type,
            'model-id': modelId,
            prompt,
            'relation-to': relationTo,
            'schema-path': schemaPath,
            system,
          },
          overrideAccess: true,
        })
      } catch (error) {
        payload.logger.error(`Failed to seed instruction for ${schemaPath}: ${error}`)
      }
    }
  }
}
