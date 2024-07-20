'use client'

import React from 'react'
import { useFieldProps } from '@payloadcms/ui'
import { FieldDescriptionProps } from 'payload'

import { useInstructions } from '../../providers/InstructionsProvider/index.js'
import { Actions } from '../../ui/Actions/Actions.js'
import { useGenerate } from '../../utilities/useGenerate.js'

export const DescriptionFieldComponent: React.FC<FieldDescriptionProps> = (props) => {
  const { type } = useFieldProps()
  const generate = useGenerate()
  const { schemaPath } = useFieldProps()
  const { id: instructionId } = useInstructions({
    path: schemaPath,
  })

  return (
    <Actions
      instructionId={instructionId}
      descriptionProps={props}
      onClickGenerate={generate[type]}
    />
  )
}
