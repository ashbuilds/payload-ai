'use client'

import { FieldDescription, useDocumentDrawer, useField, useFieldProps } from '@payloadcms/ui'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { PromptContext } from '../../providers/Prompt/index.js'
import { useDotFields } from '../../utilities/useDotFields.js'
import { useGenerate } from '../../utilities/useGenerate.js'
import styles from './actions.module.scss'
import { AiIcon3 } from './icons.js'
import { useMenu } from './useMenu.js'

function findParentWithClass(element, className) {
  // Base case: if the element is null or we've reached the top of the DOM
  if (!element || element === document.body) {
    return null
  }

  // Check if the current element has the class we're looking for
  if (element.classList.contains(className)) {
    return element
  }

  // Recursively call the function on the parent element
  return findParentWithClass(element.parentElement, className)
}

export const Actions = ({ descriptionProps, instructionId }) => {
  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer, openDrawer }] = useDocumentDrawer({
    id: instructionId,
    collectionSlug: 'instructions',
  })

  const generate = useGenerate()
  const { dotFields } = useDotFields()
  const fieldProps = useFieldProps()
  const { path: pathFromContext, schemaPath } = fieldProps
  const currentField = useField({
    path: pathFromContext,
  })

  const [fieldsInfo, setFieldsInfo] = useState(null)
  useEffect(() => {
    if (!dotFields) return

    setFieldsInfo({
      fields: Object.keys(dotFields),
      selectedField: {
        field: currentField,
        //TODO: Why props need to be passed?
        props: fieldProps,
      },
    })
  }, [dotFields, currentField, fieldProps])

  const actionsRef = useRef(null)
  useEffect(() => {
    const fieldId = `field-${pathFromContext.replace(/\./g, '__')}`
    const inputElement = document.getElementById(fieldId)

    if (!actionsRef.current) return
    actionsRef.current.setAttribute('for', fieldId)

    if (!inputElement) return

    actionsRef.current.classList.add(styles.actions_hidden)
    inputElement.addEventListener('click', (event) => {
      document.querySelectorAll('.ai-plugin-active')?.forEach((element) => {
        element.querySelector(`.${styles.actions}`).classList.add(styles.actions_hidden)
        element.classList.remove('ai-plugin-active')
      })

      actionsRef.current.classList.remove(styles.actions_hidden)
      const parentWithClass = findParentWithClass(event.target, 'field-type')
      parentWithClass.classList.add('ai-plugin-active')
    })
  }, [pathFromContext, schemaPath, actionsRef])

  useEffect(() => {
    // const { value } = currentField
  }, [currentField])

  const { ActiveComponent, Menu } = useMenu({
    onCompose: () => {
      console.log('Composing...')
      // generate()
    },
    onProofread: () => {
      console.log('Proofreading...')
    },
    onRephrase: () => {
      console.log('Rephrasing...')
    },
    onSettings: openDrawer,
  })

  return (
    <React.Fragment>
      <label className={`${styles.actions}`} ref={actionsRef}>
        <PromptContext.Provider value={fieldsInfo}>
          <DocumentDrawer
            onSave={() => {
              closeDrawer()
            }}
          />
        </PromptContext.Provider>
        <Menu button={<AiIcon3 />} />
        <ActiveComponent />
      </label>
      <div>
        <FieldDescription {...descriptionProps} />
      </div>
    </React.Fragment>
  )
}
