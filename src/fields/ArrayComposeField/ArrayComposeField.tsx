'use client'

import type { ClientField } from 'payload'

import { FieldDescription, useDocumentInfo } from '@payloadcms/ui'
import React from 'react'

import { FieldProvider } from '../../providers/FieldProvider/FieldProvider.js'
import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { Compose } from '../../ui/Compose/Compose.js'

type ArrayComposeFieldProps = {
  [key: string]: any
  field: ClientField
  path?: string
  schemaPath?: string
}

/**
 * ArrayComposeField - A version of ComposeField specifically for array fields.
 * Unlike regular fields, arrays don't have focus events, so this component
 * renders the Compose button immediately (always visible).
 */
export const ArrayComposeField = (props: ArrayComposeFieldProps) => {
  const { collectionSlug } = useDocumentInfo()

  const finalSchemaPath =
    props?.schemaPath ??
    (collectionSlug ? `${collectionSlug}.${props?.path ?? ''}` : (props?.path ?? ''))

  const {
    id: instructionId,
    disabled,
    hasInstructions,
    isConfigAllowed,
  } = useInstructions({
    schemaPath: finalSchemaPath,
  })

  const adminDescription = props?.field?.admin || {}
  const description = "description" in adminDescription ? adminDescription.description : ""

  return (
    <FieldProvider
      context={{
        field: props?.field,
        path: props?.path ?? '',
        schemaPath: finalSchemaPath,
      }}
    >
      {/* Always render Compose for arrays (no focus-dependent placeholder) */}
      {hasInstructions && instructionId && !disabled ? (
        <Compose
          descriptionProps={{
            ...props,
            field: props?.field,
            path: props?.path ?? '',
            schemaPath: finalSchemaPath,
          }}
          forceVisible={true}
          instructionId={instructionId}
          isConfigAllowed={isConfigAllowed}
        />
      ) : null}

      <div>
        <FieldDescription description={description as any} path={props?.path as string} />
      </div>
    </FieldProvider>
  )
}
