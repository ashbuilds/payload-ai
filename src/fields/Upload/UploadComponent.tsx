'use client'

import type { UploadFieldProps } from '@payloadcms/ui'

import {
  Pill,
  UploadField,
  useDocumentInfo,
  useField,
  useFieldProps,
  useLocale,
} from '@payloadcms/ui'
import React, { useCallback } from 'react'

import type { GenerateTextarea } from '../../types.js'

import { Actions } from '../../ui/Actions/Actions.js'
import { useDotFields } from '../../utilities/useDotFields.js'
import { useInstructions } from '../../utilities/useInstructions.js'
import styles from './styles.module.scss';

export const UploadComponent: React.FC<UploadFieldProps> = (props) => {
  const { name, CustomLabel, label, labelProps, locale, path: pathFromProps, relationTo } = props

  const { instructions, noticeMessage, setMessage } = useInstructions({
    path: pathFromProps,
  })

  const docInfo = useDocumentInfo()
  const { path: pathFromContext } = useFieldProps()

  const { setValue } = useField<string>({
    path: pathFromContext || pathFromProps || name,
  })
  const localFromContext = useLocale()
  const { getDotFields } = useDotFields()
  const regenerateImage = useCallback(() => {
    const { fields = {} } = getDotFields()
    if (!Object.keys(fields).length) {
      console.log('dotFields is empty')
      return
    }

    fetch('/api/ai/generate/upload', {
      body: JSON.stringify({
        ...docInfo,
        doc: fields,
        locale: localFromContext?.code || locale?.code,
        options: {
          instructionId: instructions?.id,
          uploadCollectionSlug: relationTo,
        },
      } satisfies Parameters<GenerateTextarea>[0]),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
      .then(async (generatedImageResponse) => {
        if (generatedImageResponse.ok) {
          const { result: generatedImage } = await generatedImageResponse.json()
          setValue(generatedImage?.id)
          setMessage({
            label: '',
            message: '',
          })
        } else {
          const { errors = [] } = await generatedImageResponse.json()
          const errStr = errors.map((error) => error.message).join(', ')
          setMessage({
            label: 'Error',
            message: errStr,
          })
          throw new Error(errStr)
        }
      })
      .catch((error) => {
        console.error('Error generating image', error)
      })
  }, [
    getDotFields,
    docInfo,
    localFromContext?.code,
    locale?.code,
    instructions?.id,
    relationTo,
    setValue,
    setMessage,
  ])

  return (
    <div className="field-type">
      <UploadField
        {...props}
        CustomLabel={
          instructions ? (
            <Actions
              CustomLabel={CustomLabel}
              instructions={instructions}
              label={label}
              labelProps={labelProps}
              onClickGenerate={regenerateImage}
            />
          ) : (
            CustomLabel
          )
        }
      />
      {noticeMessage.label && (
        <div className={styles.error_message}>
          <Pill className={styles.pill} pillStyle="error">
            {noticeMessage.label}
          </Pill>
          <div className={styles.error_message_text}>
            <small>{noticeMessage.message}</small>
          </div>
        </div>
      )}
    </div>
  )
}
