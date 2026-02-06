import { useDocumentInfo } from '@payloadcms/ui'
import { useContext, useEffect, useMemo, useState } from 'react'

import { PLUGIN_INSTRUCTIONS_TABLE } from '../../defaults.js'
import { handlebarsHelpers, handlebarsHelpersMap } from '../../libraries/handlebars/helpersMap.js'
import { InstructionsContext } from './context.js'

/**
 * Normalize a schema path by removing array indices.
 * This allows fields inside arrays to match their instruction records.
 * 
 * Example:
 *   'array-test-cases.keywords.0.keyword' -> 'array-test-cases.keywords.keyword'
 *   'characters.views.2.description' -> 'characters.views.description'
 *   'posts.title' -> 'posts.title' (no change)
 */
const normalizeSchemaPath = (path: string): string => {
  if (!path) {
    return path
  }
  // Remove numeric path segments (array indices)
  return path.split('.').filter(segment => !/^\d+$/.test(segment)).join('.')
}

const warnedOnceOnNoInstructionId = new Set<string>()
const warnOnceOnMissingInstructions = (path: string) => {
  if (!warnedOnceOnNoInstructionId.has(path)) {
    warnedOnceOnNoInstructionId.add(path)
    // eslint-disable-next-line no-console
    console.info(`[AI Plugin] There are no AI instructions for this field: ${path}. Enable "generatePromptOnInit" option to enable them.`)
  }
}

export const useInstructions = (
  update: {
    schemaPath?: unknown
  } = {},
) => {
  const context = useContext(InstructionsContext)
  const { collectionSlug } = useDocumentInfo()
  const { activeCollection, debugging, hasInstructions, instructions, promptFields, setActiveCollection } = context

  const [schemaPath, setSchemaPath] = useState(update.schemaPath as string)

  useEffect(() => {
    if (update.schemaPath !== schemaPath) {
      setSchemaPath((update.schemaPath as string) ?? '')
    }
  }, [update.schemaPath, schemaPath])

  useEffect(() => {
    if (
      activeCollection !== collectionSlug &&
      collectionSlug !== PLUGIN_INSTRUCTIONS_TABLE &&
      typeof setActiveCollection === 'function'
    ) {
      setActiveCollection(collectionSlug ?? '')
    }
  }, [activeCollection, collectionSlug, setActiveCollection])

  const groupedFields = useMemo(() => {
    const result: Record<string, string[]> = {}

    for (const fullKey of Object.keys(instructions || {})) {
      const [collection, ...pathParts] = fullKey.split('.')
      const path = pathParts.join('.')
      if (!result[collection]) {
        result[collection] = []
      }
      result[collection].push(path)
    }

    return result
  }, [instructions])

  // Suggestions for prompt editor
  const promptEditorSuggestions = useMemo(() => {
    const activeFields = groupedFields[activeCollection as string] || []
    const suggestions: string[] = []

    // Build instruction lookup map once for O(1) access instead of O(n) search per field
    const instructionLookup = new Map(
      Object.entries(instructions).map(([key, value]) => {
        const path = key.split('.').slice(1).join('.')
        return [path, value]
      })
    )

    activeFields.forEach((f) => {
      const fieldInfo = instructionLookup.get(f)

      if (!fieldInfo) {return}

      if (fieldInfo.fieldType === 'upload') {
        return
      }

      const helpers = handlebarsHelpers.filter(
        (h) => (handlebarsHelpersMap as Record<string, { field?: string }>)[h]?.field === fieldInfo.fieldType,
      )

      if (helpers.length) {
        for (const helper of helpers) {
          suggestions.push(`${helper} ${f}`)
        }
      } else {
        suggestions.push(f)
      }
    })

    promptFields.forEach(({ name, collections }) => {
      if (!activeCollection) {return}

      if (!collections || collections.includes(activeCollection)) {
        suggestions.push(name)
      }
    })

    return suggestions
  }, [groupedFields, activeCollection, instructions, promptFields])

  // Normalize the schema path to handle array indices
  const normalizedSchemaPath = normalizeSchemaPath(schemaPath)
  const pathInstructions = instructions[normalizedSchemaPath]

  if (debugging && !pathInstructions && schemaPath && hasInstructions) {
    warnOnceOnMissingInstructions(schemaPath)
  }

  const isCollectionEnabled = context.enabledCollections?.includes(collectionSlug || activeCollection || '') ?? false

  return {
    ...context,
    ...(pathInstructions || {}),
    disabled: !isCollectionEnabled || (pathInstructions?.disabled ?? false),
    promptEditorSuggestions,
  }
}

