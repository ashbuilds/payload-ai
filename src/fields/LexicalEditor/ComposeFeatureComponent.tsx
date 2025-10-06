import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

import { FieldProvider } from '../../providers/FieldProvider/FieldProvider.js'
import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { Compose } from '../../ui/Compose/Compose.js'

export const ComposeFeatureComponent = (props: any) => {
  const {
    id: instructionId,
    disabled,
    isConfigAllowed,
    enabledCollections,
  } = useInstructions({
    schemaPath: props?.clientProps?.schemaPath,
  })
  const { collectionSlug } = useDocumentInfo()

  const isCollectionEnabled =
    !enabledCollections || !collectionSlug
      ? true
      : (enabledCollections as string[]).includes(collectionSlug)

  if (!isCollectionEnabled) {
    return null
  }

  if (!instructionId || disabled) {
    return null
  }

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
        isConfigAllowed={isConfigAllowed}
      />
    </FieldProvider>
  )
}
