'use client'

import { useFieldProps } from '@payloadcms/ui'
import React from 'react'

import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { Actions } from '../../ui/Actions/Actions.js'
import { FieldDescriptionClientProps } from 'payload'

export const DescriptionField: React.FC<FieldDescriptionClientProps> = (props) => {
  const { schemaPath } = useFieldProps()
  const { id: instructionId } = useInstructions({
    path: schemaPath,
  })

  return <Actions descriptionProps={props} instructionId={instructionId} />
}
