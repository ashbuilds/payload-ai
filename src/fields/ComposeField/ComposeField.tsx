'use client'

import React from 'react'

import { FieldProvider } from '../../providers/FieldProvider/FieldProvider.js'
import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { Compose } from '../../ui/Compose/Compose.js'

export const ComposeField = (props) => {

  const { id: instructionId, isConfigAllowed } = useInstructions({
    schemaPath: props?.schemaPath,
  })

  return (
    <FieldProvider
      context={{
        type: props?.field.type,
        path: props?.path,
        schemaPath: props?.schemaPath,
      }}
    >
      <Compose descriptionProps={props} instructionId={instructionId} isConfigAllowed={isConfigAllowed} />
    </FieldProvider>
  )
}
