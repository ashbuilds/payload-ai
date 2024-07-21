'use client'

import { FieldDescription, useDocumentDrawer, useField, useFieldProps } from '@payloadcms/ui'
import React, { useEffect, useRef, useState } from 'react'

import { PromptContext } from '../../providers/Prompt/index.js'
import { useDotFields } from '../../utilities/useDotFields.js'
import styles from './actions.module.scss'
import { AiIcon3 } from './icons.js'

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

export const Actions = ({ descriptionProps, instructionId, onClickGenerate }) => {
  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer, openDrawer }] = useDocumentDrawer({
    id: instructionId,
    collectionSlug: 'instructions',
  })

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

    if (!inputElement) {
      return
    }

    actionsRef.current.setAttribute('for', fieldId)
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

  const handleGenerate = (event) => {}

  return (
    <React.Fragment>
      <label className={`${styles.actions}`} htmlFor="input" ref={actionsRef}>
        <PromptContext.Provider value={fieldsInfo}>
          <DocumentDrawer
            onSave={() => {
              closeDrawer()
            }}
          />
        </PromptContext.Provider>
        <DocumentDrawerToggler className={styles.generate_button}>
          <AiIcon3 />
        </DocumentDrawerToggler>
        <span
          className={styles.generate_button}
          onClick={handleGenerate}
          onKeyDown={handleGenerate}
          role="presentation"
        >
          Generate
        </span>
      </label>
      <div>
        <FieldDescription {...descriptionProps} />
      </div>
    </React.Fragment>
  )
}
