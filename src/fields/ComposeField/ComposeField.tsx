'use client'

import {FieldDescription} from "@payloadcms/ui";
import React from 'react'

import { FieldProvider } from '../../providers/FieldProvider/FieldProvider.js'
import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { Compose } from '../../ui/Compose/Compose.js'

export const ComposeField = (props) => {

  const { id: instructionId, hasInstructions, isConfigAllowed,  } = useInstructions({
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
      {hasInstructions && instructionId ? (
        <Compose descriptionProps={props} instructionId={instructionId} isConfigAllowed={isConfigAllowed} />
      ) : null}
      {/*Render the incoming description field*/}
      <div>
        <FieldDescription {...props} />
      </div>
    </FieldProvider>
  )
}
