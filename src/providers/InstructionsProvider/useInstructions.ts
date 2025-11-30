import { InstructionsContext } from '@ai-stack/payloadcms/client'
import { useDocumentInfo } from '@payloadcms/ui'
import { useContext, useEffect, useMemo, useState } from 'react'

import { PLUGIN_INSTRUCTIONS_TABLE } from '../../defaults.js'
import { handlebarsHelpers, handlebarsHelpersMap } from '../../libraries/handlebars/helpersMap.js'


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
  }, [update.schemaPath])

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

    activeFields.forEach((f) => {
      const fieldKey = Object.keys(instructions).find((k) => k.endsWith(f))
      const fieldInfo = fieldKey ? instructions[fieldKey] : undefined

      if (!fieldInfo) {return}

      if (fieldInfo.fieldType === 'upload') {
        suggestions.push(`${f}.url`)
        return
      }

      const helpers = handlebarsHelpers.filter(
        (h) => (handlebarsHelpersMap as Record<string, any>)[h]?.field === fieldInfo.fieldType,
      )

      if (helpers.length) {
        for (const helper of helpers) {
          suggestions.push(`${helper} ${f}`)
        }
      } else {
        suggestions.push(f)
      }
    }, [])

    promptFields.forEach(({ name, collections }) => {
      if (!activeCollection) {return}

      if (!collections || collections.includes(activeCollection)) {
        suggestions.push(name)
      }
    })

    return suggestions
  }, [groupedFields, activeCollection, instructions, promptFields])

  const pathInstructions = instructions[schemaPath]

  if (debugging && !pathInstructions && schemaPath && hasInstructions) {
    warnOnceOnMissingInstructions(schemaPath)
  }
  
  return {
    ...context,
    ...(pathInstructions || {}),
    promptEditorSuggestions,
  }
}
