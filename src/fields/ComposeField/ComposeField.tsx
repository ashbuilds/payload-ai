'use client'

import React from 'react'

import { FieldProvider } from '../../providers/FieldProvider/FieldProvider.js'
import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { Compose } from '../../ui/Compose/Compose.js'

type ComposeFieldProps = {
  [key: string]: any
  field: { type: string }
  path?: string
  schemaPath?: string
}

export const ComposeField = (props: ComposeFieldProps) => {
  const { id: instructionId, isConfigAllowed } = useInstructions({
    schemaPath: props?.schemaPath,
  })

  return (
    <FieldProvider
      context={{
        type: (props?.field as any).type,
        path: props?.path ?? '',
        schemaPath: props?.schemaPath ?? '',
      }}
    >
      <Compose
        descriptionProps={{
          ...props,
          field: props?.field as any,
          path: props?.path ?? '',
          schemaPath: props?.schemaPath ?? '',
        }}
        instructionId={instructionId}
        isConfigAllowed={isConfigAllowed}
      />
    </FieldProvider>
  )
}
