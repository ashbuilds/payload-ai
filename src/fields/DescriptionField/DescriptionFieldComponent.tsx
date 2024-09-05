'use client'

// import type { FieldDescriptionProps } from 'payload'

import { useFieldProps } from '@payloadcms/ui'
import React from 'react'

import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { Actions } from '../../ui/Actions/Actions.js'

export const DescriptionFieldComponent: React.FC = (props) => {
  const { schemaPath } = useFieldProps()
  const { id: instructionId } = useInstructions({
    path: schemaPath,
  })

  return <Actions descriptionProps={props} instructionId={instructionId} />
}
