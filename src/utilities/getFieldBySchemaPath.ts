import type { ClientCollectionConfig, CollectionConfig, Field } from 'payload'

export const getFieldBySchemaPath = (
  collectionConfig: ClientCollectionConfig | CollectionConfig,
  schemaPath: string, // e.g., "posts.content"
): Field | null => {
  const pathParts = schemaPath.split('.')
  const targetFieldName = pathParts[pathParts.length - 1]

  const findField = (fields, remainingPath: string[]): Field | null => {
    for (const field of fields) {
      if (remainingPath.length === 1 && field.name === targetFieldName) {
        return field
      }

      if (field.type === 'group' && field.fields) {
        const result = findField(field.fields, remainingPath.slice(1))
        if (result) return result
      }

      if (field.type === 'array' && field.fields) {
        const result = findField(field.fields, remainingPath.slice(1))
        if (result) return result
      }

      if (field.type === 'tabs') {
        for (const tab of field.tabs) {
          const result = findField(tab.fields, remainingPath)
          if (result) return result
        }
      }

      if (field.type === 'blocks') {
        for (const block of field.blocks) {
          if (block.slug === remainingPath[0]) {
            const result = findField(block.fields, remainingPath.slice(1))
            if (result) return result
          }
        }
      }
    }

    return null
  }

  return findField(collectionConfig.fields, pathParts.slice(1))
}
