'use client'

import { FieldDescription, useDocumentDrawer, useField, useFieldProps } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import { PromptContext } from '../../providers/Prompt/index.js'
import { useDotFields } from '../../utilities/useDotFields.js'
import styles from './actions.module.scss'

export const Actions = ({ descriptionProps, instructionId, onClickGenerate }) => {
  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer, openDrawer }] = useDocumentDrawer({
    id: instructionId,
    collectionSlug: 'instructions',
  })

  const { dotFields } = useDotFields()
  const fieldProps = useFieldProps()
  const { path: pathFromContext } = fieldProps
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
        props: fieldProps,
      },
    })
  }, [dotFields, currentField, fieldProps])

  return (
    <React.Fragment>
      <PromptContext.Provider value={fieldsInfo}>
        <DocumentDrawer
          onSave={() => {
            closeDrawer()
          }}
        />
      </PromptContext.Provider>
      <div className={styles.label_label}>
        <FieldDescription {...descriptionProps} />
        <React.Fragment>
          &nbsp; &mdash; &nbsp;
          <button className={styles.generate_button} onClick={onClickGenerate} type="button">
            Auto-generate
          </button>
          &nbsp; &mdash; &nbsp;
          <DocumentDrawerToggler className={styles.generate_button}>
            Edit Instructions
          </DocumentDrawerToggler>
        </React.Fragment>
      </div>
    </React.Fragment>
  )
}
