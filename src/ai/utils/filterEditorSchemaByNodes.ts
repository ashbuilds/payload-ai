import type { LexicalNodeSchema } from '../schemas/lexicalJsonSchema.js'

import { isObjectSchema } from './isObjectSchema.js'
import { coreNodeTypes, nodeClassToType, nodeTypeToSchemaMap } from './nodeToSchemaMap.js'

/**
 * Filters the Lexical JSON schema to only include definitions for allowed nodes.
 *
 * @param schema - The full Lexical JSON schema
 * @param allowedNodes - Array of allowed node types. Can be either:
 *   - Node class names (e.g., 'HeadingNode', 'ParagraphNode')
 *   - Type values (e.g., 'heading', 'paragraph')
 * @returns A filtered schema containing only the allowed definitions
 */
export function filterEditorSchemaByNodes(schema: LexicalNodeSchema, allowedNodes: string[]) {
  // Normalize node names to lowercase type values
  const normalizedTypes = new Set<string>()

  // Always include core nodes
  for (const coreType of coreNodeTypes) {
    normalizedTypes.add(coreType)
  }

  // Add user-specified allowed nodes
  for (const node of allowedNodes) {
    // Handle both formats: 'HeadingNode' and 'heading'
    const normalized = node.includes('Node') ? nodeClassToType(node) : node.toLowerCase()
    normalizedTypes.add(normalized)
  }

  const filteredDefinitions: Record<string, any> = {}

  // First pass: collect definitions whose "type.enum" includes an allowed type
  for (const [key, def] of Object.entries(schema.definitions ?? {})) {
    if (isObjectSchema(def)) {
      const typeEnum = def.properties?.type?.enum
      if (typeEnum && typeEnum.some((t) => normalizedTypes.has(t))) {
        filteredDefinitions[key] = JSON.parse(JSON.stringify(def)) // Deep copy to safely mutate
      }
    }
  }

  // Ensure core schema definitions are included by checking the map
  for (const coreType of coreNodeTypes) {
    const defName = nodeTypeToSchemaMap[coreType]
    if (defName && schema.definitions?.[defName] && !filteredDefinitions[defName]) {
      filteredDefinitions[defName] = JSON.parse(JSON.stringify(schema.definitions[defName]))
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
