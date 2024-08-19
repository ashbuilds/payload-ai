import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { useFieldProps } from '@payloadcms/ui'

import { useInstructions } from '../../providers/InstructionsProvider/hook.js'
import { Actions } from '../../ui/Actions/Actions.js'

export const ActionsFeatureComponent = () => {
  const { schemaPath } = useFieldProps()

  const { id: instructionId } = useInstructions({
    path: schemaPath,
  })

  return <Actions instructionId={instructionId} />
}
