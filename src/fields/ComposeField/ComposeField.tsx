'use client'

import type { ClientField } from 'payload'

import { useDocumentInfo } from '@payloadcms/ui'
import React from 'react'

import { FieldProvider } from '../../providers/FieldProvider/FieldProvider.js'
import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { Compose } from '../../ui/Compose/Compose.js'

type ComposeFieldProps = {
  [key: string]: any
  field: ClientField
  path?: string
  schemaPath?: string
}

export const ComposeField = (props: ComposeFieldProps) => {
  const { collectionSlug } = useDocumentInfo()

  const finalSchemaPath =
    props?.schemaPath ??
    (collectionSlug ? `${collectionSlug}.${props?.path ?? ''}` : (props?.path ?? ''))

  const { id: instructionId, isConfigAllowed } = useInstructions({
    schemaPath: finalSchemaPath,
  })

  return (
    <FieldProvider
      context={{
        type: (props?.field as any).type,
        path: props?.path ?? '',
        schemaPath: finalSchemaPath,
      }}
    >
      <Compose
        descriptionProps={{
          ...props,
          field: props?.field,
          path: props?.path ?? '',
          schemaPath: finalSchemaPath,
        }}
        instructionId={instructionId}
        isConfigAllowed={isConfigAllowed}
      />
    </FieldProvider>
  )
}
