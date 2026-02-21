'use client'

import type { ClientField } from 'payload'

import { FieldDescription, useDocumentInfo } from '@payloadcms/ui'
import React from 'react'

import { FieldProvider } from '../../providers/FieldProvider/FieldProvider.js'
import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { Compose } from '../../ui/Compose/Compose.js'
import { ComposePlaceholder } from '../../ui/Compose/ComposePlaceholder.js'

type ComposeFieldProps = {
  [key: string]: any
  alwaysShow?: boolean
  field: ClientField
  path?: string
  schemaPath?: string
}

export const ComposeField = (props: ComposeFieldProps) => {
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

  const descriptionProps = {
    ...props,
    field: props?.field,
    path: props?.path ?? '',
    schemaPath: finalSchemaPath,
  }

  const shouldRender = hasInstructions && instructionId && !disabled

  return (
    <FieldProvider
      context={{
        field: props?.field,
        path: props?.path ?? '',
        schemaPath: finalSchemaPath,
      }}
    >
      {shouldRender ? (
        props.alwaysShow ? (
          <Compose
            descriptionProps={descriptionProps}
            forceVisible={true}
            instructionId={instructionId}
            isConfigAllowed={isConfigAllowed}
          />
        ) : (
          <ComposePlaceholder
            descriptionProps={descriptionProps}
            instructionId={instructionId}
            isConfigAllowed={isConfigAllowed}
          />
        )
      ) : null}

      <div>
        <FieldDescription description={description as any} path={props?.path as string} />
      </div>
    </FieldProvider>
  )
}
