import { useFieldProps } from '@payloadcms/ui'
import React from 'react'

import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { Compose } from '../../ui/Compose/Compose.js'

export const ComposeFeatureComponent = () => {
  const { schemaPath } = useFieldProps()

  const { id: instructionId } = useInstructions({
    path: schemaPath,
  })

  return <Compose instructionId={instructionId} />
}
