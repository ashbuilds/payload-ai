import React from 'react'

import { FieldProvider } from '../../providers/FieldProvider/FieldProvider.js'
import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { Compose } from '../../ui/Compose/Compose.js'

export const ComposeFeatureComponent = (props: any) => {
  const { id: instructionId } = useInstructions({
    schemaPath: props?.clientProps?.schemaPath,
  })

  return (
    <FieldProvider
      context={{
        type: props?.clientProps?.field?.type,
        path: props?.clientProps?.path,
        schemaPath: props?.clientProps?.schemaPath,
      }}
    >
      <Compose
        descriptionProps={{
          field: props?.clientProps?.field,
          path: props?.clientProps?.path,
          schemaPath: props?.clientProps?.schemaPath,
          ...props?.clientProps,
        }}
        instructionId={instructionId}
      />
    </FieldProvider>
  )
}
