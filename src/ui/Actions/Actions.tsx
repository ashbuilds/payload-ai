import {FieldLabel, useDocumentDrawer, useField, useFieldProps} from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import { PromptContext } from '../../providers/Prompt/index.js'
import { useDotFields } from '../../utilities/useDotFields.js'
import styles from './actions.module.scss';

export const Actions = ({ CustomLabel, instructions, label, labelProps, onClickGenerate }) => {
  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer }] = useDocumentDrawer({
    id: instructions?.id,
    collectionSlug: 'instructions',
  })

  const { dotFields } = useDotFields()
  const fieldProps = useFieldProps()
  const { path: pathFromContext } = fieldProps;
  const currentField = useField({
    path: pathFromContext,
  });

  const [fieldsInfo, setFieldsInfo] = useState(null)
  useEffect(() => {
    if (fieldsInfo || !dotFields) return

    setFieldsInfo({
      fields: Object.keys(dotFields),
      selectedField: {
        field: currentField,
        props: fieldProps
      },
    })
  }, [dotFields, fieldsInfo, currentField, fieldProps])

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
        <FieldLabel CustomLabel={CustomLabel} label={label} {...(labelProps || {})} />
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
