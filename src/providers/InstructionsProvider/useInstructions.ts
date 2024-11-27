import { useContext, useEffect, useState } from 'react'

import { handlebarsHelpers, handlebarsHelpersMap } from '../../libraries/handlebars/helpersMap.js'
import { InstructionsContext } from './InstructionsProvider.js'

export const useInstructions = (
  update: {
    schemaPath?: unknown
  } = {},
) => {
  const context = useContext(InstructionsContext)

  //Fields are used for autocompletion in PromptTextareaField
  const fields = Object.keys(context.instructions || {}).map((key) => {
    return key.split('.').slice(1).join('.')
  })

  const promptEditorSuggestions = [...fields].reduce((acc, f) => {
    const fieldKey = Object.keys(context.instructions).find((k) => k.endsWith(f))
    const fieldInfo = context.instructions[fieldKey]

    // Currently, Upload fields are excluded from suggestions
    if (fieldInfo.fieldType === 'upload') {
      return acc
    }

    const helpers = handlebarsHelpers.filter(
      (h) => handlebarsHelpersMap[h]?.field === fieldInfo.fieldType,
    )

    if (helpers.length) {
      for (const helper of helpers) {
        acc.push(helper + ` ${f}`)
      }
      return acc
    }

    acc.push(f)
    return acc
  }, [])

  const [schemaPath, setSchemaPath] = useState(update.schemaPath as string)

  useEffect(() => {
    if(update.schemaPath !== schemaPath) {
      setSchemaPath(update.schemaPath as string)
    }
  }, [schemaPath, update])

  return {
    ...context,
    ...(context.instructions[schemaPath] || {}),
    fields,
    map: context.instructions,
    promptEditorSuggestions,
  }
}
