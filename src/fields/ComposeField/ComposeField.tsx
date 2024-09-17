'use client'

import { useFieldProps } from '@payloadcms/ui'
import React from 'react'

import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { Compose } from '../../ui/Compose/Compose.js'
import { FieldDescriptionClientProps } from 'payload'

export const ComposeField: React.FC<FieldDescriptionClientProps> = (props) => {
  const { schemaPath } = useFieldProps()
  const { id: instructionId } = useInstructions({
    path: schemaPath,
  })

  return <Compose descriptionProps={props} instructionId={instructionId} />
}
