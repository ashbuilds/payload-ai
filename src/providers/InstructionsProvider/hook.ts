import { useContext } from 'react'

import { InstructionsContext } from './InstructionsProvider.js'

export const useInstructions = ({ path }) => {
  const context = useContext(InstructionsContext)

  //Fields are used for autocompletion in PromptTextareaField
  const fields = Object.keys(context.instructions || {}).map((key) => {
    return key.split('.').slice(1).join('.')
  })

  return { ...context, id: context.instructions[path], fields, map: context.instructions }
}
