'use client'

import type { ClientField } from 'payload'

import { FieldDescription, useDocumentInfo } from '@payloadcms/ui'
import React from 'react'
import { createPortal } from 'react-dom'

import { FieldProvider } from '../../providers/FieldProvider/FieldProvider.js'
import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { Compose } from '../../ui/Compose/Compose.js'
import styles from '../../ui/Compose/compose.module.css'

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

  // Portal target state
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null)

  // State to track if the "Add Row" button is present in the DOM
  const [isAddRowPresent, setIsAddRowPresent] = React.useState(true)

  React.useEffect(() => {
    if (props.field && 'name' in props.field) {
      const fieldId = `field-${props.field.name}`
      const fieldElement = document.getElementById(fieldId)
      
      if (fieldElement) {
        fieldElement.classList.add(styles.arrayFieldWrapper)
        // Force relative position via inline style to prevent class application delays/overrides
        fieldElement.style.position = 'relative'
        setPortalTarget(fieldElement)

        // Check initial state
        const checkAddRow = () => {
          const btn = fieldElement.querySelector('.array-field__add-row')
          setIsAddRowPresent(!!btn)
        }
        
        checkAddRow()

        // Observe for changes (e.g. when max rows reached and button is removed)
        const observer = new MutationObserver(checkAddRow)
        observer.observe(fieldElement, { childList: true, subtree: true })

        return () => observer.disconnect()
      }
    }
  }, [props.field])

  const adminDescription = props?.field?.admin || {}
  const description = 'description' in adminDescription ? adminDescription.description : ''

  return (
    <FieldProvider
      context={{
        field: props?.field,
        path: props?.path ?? '',
        schemaPath: finalSchemaPath,
      }}
    >
      <div>
        <FieldDescription description={description as any} path={props?.path as string} />
      </div>

      {/* Portal the Compose button to the bottom of the field wrapper */}
      {hasInstructions && instructionId && !disabled && portalTarget
        ? createPortal(
            <div 
              className={`
                ${styles.composePortal} 
                ${isAddRowPresent ? styles.composePortalAbsolute : styles.composePortalStatic}
              `}
            >
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
            </div>,
            portalTarget,
          )
        : null}
    </FieldProvider>
  )
}
