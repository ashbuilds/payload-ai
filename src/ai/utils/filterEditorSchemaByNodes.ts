import type { LexicalNodeSchema } from '../schemas/lexicalJsonSchema.js'

import { isObjectSchema } from './isObjectSchema.js'

export function filterEditorSchemaByNodes(schema: LexicalNodeSchema, allowedNodes: string[]) {
  const allowedTypes = new Set(allowedNodes)

  const filteredDefinitions: Record<string, any> = {}

  // First pass: collect definitions whose "type.enum" includes an allowed type
  for (const [key, def] of Object.entries(schema.definitions ?? {})) {
    if (isObjectSchema(def)) {
      const typeEnum = def.properties?.type?.enum
      if (typeEnum && typeEnum.some((t) => allowedTypes.has(t))) {
        filteredDefinitions[key] = JSON.parse(JSON.stringify(def)) // Deep copy to safely mutate
      }
    }
  }

  // Helper to check if a $ref points to an allowed definition
  const isAllowedRef = (ref: string) => {
    if (typeof ref !== 'string') {
      return false
    }
    const defName = ref.replace('#/definitions/', '')
    return defName in filteredDefinitions
  }

  // Second pass: update "children" in each definition to only include allowed refs
  for (const def of Object.values(filteredDefinitions)) {
    if (isObjectSchema(def) && def.properties?.children?.items) {
      const items = def.properties.children.items

      if (Array.isArray(items.anyOf)) {
        // Filter anyOf to only allowed $refs
        items.anyOf = items.anyOf.filter((entry) => isAllowedRef(entry.$ref))
        if (items.anyOf.length === 0) {
          delete def.properties.children
        }
      } else if (items.$ref && !isAllowedRef(items.$ref)) {
        delete def.properties.children
      }
    }
  }

  // Return the new schema with pruned definitions
  return {
    ...schema,
    definitions: filteredDefinitions,
  }
}
