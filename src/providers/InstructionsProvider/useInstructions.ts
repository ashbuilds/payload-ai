import { useDocumentInfo } from '@payloadcms/ui'
import { useContext, useEffect, useMemo, useState } from 'react'

import { PLUGIN_INSTRUCTIONS_TABLE } from '../../defaults.js'
import { handlebarsHelpers, handlebarsHelpersMap } from '../../libraries/handlebars/helpersMap.js'
import { InstructionsContext } from './InstructionsProvider.js'

export const useInstructions = (
  update: {
    schemaPath?: unknown
  } = {},
) => {
  const context = useContext(InstructionsContext)
  const { collectionSlug } = useDocumentInfo()
  const { activeCollection, instructions, setActiveCollection } = context

  const [schemaPath, setSchemaPath] = useState(update.schemaPath as string)

  useEffect(() => {
    if (update.schemaPath !== schemaPath) {
      setSchemaPath(update.schemaPath as string)
    }
  }, [update.schemaPath])

  useEffect(() => {
    if (activeCollection !== collectionSlug && collectionSlug !== PLUGIN_INSTRUCTIONS_TABLE) {
      setActiveCollection(collectionSlug)
    }
  }, [activeCollection, collectionSlug, setActiveCollection])

  const groupedFields = useMemo(() => {
    const result: Record<string, string[]> = {}

    for (const fullKey of Object.keys(instructions)) {
      const [collection, ...pathParts] = fullKey.split('.')
      const path = pathParts.join('.')
      if (!result[collection]) result[collection] = []
      result[collection].push(path)
    }

    return result
  }, [instructions])

  // Suggestions for prompt editor
  const promptEditorSuggestions = useMemo(() => {
    const activeFields = groupedFields[activeCollection] || []

    return activeFields.reduce<string[]>((acc, f) => {
      const fieldKey = Object.keys(instructions).find((k) => k.endsWith(f))
      const fieldInfo = instructions[fieldKey]

      if (!fieldInfo) return acc

      if (fieldInfo.fieldType === 'upload') {
        acc.push(`${f}.url`)
        return acc
      }

      const helpers = handlebarsHelpers.filter(
        (h) => handlebarsHelpersMap[h]?.field === fieldInfo.fieldType,
      )

      if (helpers.length) {
        for (const helper of helpers) {
          acc.push(`${helper} ${f}`)
        }
      } else {
        acc.push(f)
      }

      return acc
    }, [])
  }, [groupedFields, activeCollection, instructions])

  return {
    ...context,
    ...(instructions[schemaPath] || {}),
    promptEditorSuggestions,
  }
}
