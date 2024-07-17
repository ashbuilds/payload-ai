'use client'

import { UploadFieldProps, useForm, FieldComponentProps, SelectFieldProps } from '@payloadcms/ui'

import {
  Pill,
  UploadField,
  useDocumentInfo,
  useField,
  useFieldProps,
  useLocale,
} from '@payloadcms/ui'
import React, { useCallback, useEffect } from 'react'

import type { GenerateTextarea } from '../../types.js'

import { Actions } from '../../ui/Actions/Actions.js'
import { useDotFields } from '../../utilities/useDotFields.js'
import { useInstructions } from '../../utilities/useInstructions.js'
import { RichTextFieldProps } from 'payload'
// import styles from './styles.module.scss.js';

export const RichTextLabel: React.FC<SelectFieldProps> = (props) => {
  // console.log('RichTextLabel props:', props)
  const {
    name,
    CustomLabel,
    label,
    labelProps,
    locale,
    // @ts-expect-error
    schemaPath: pathFromProps,
    // @ts-expect-error
    relationTo,
  } = props

  const { instructions, noticeMessage, setMessage } = useInstructions({
    path: pathFromProps,
  })

  const docInfo = useDocumentInfo()
  const { path: pathFromContext } = useFieldProps()
  const { getData, getDataByPath, getSiblingData, setModified } = useForm()
  const { setValue, path: fieldPath } = useField<string>({
    path: pathFromContext || pathFromProps || name,
  })

  const localFromContext = useLocale()
  const { getDotFields } = useDotFields()
  const regenerateObject = useCallback(() => {
    const { fields = {} } = getDotFields()
    if (!Object.keys(fields).length) {
      console.log('dotFields is empty')
      return
    }

    fetch('/api/ai/generate/textarea', {
      body: JSON.stringify({
        ...docInfo,
        doc: fields,
        locale: localFromContext?.code || locale?.code,
        options: {
          instructionId: instructions?.id,
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
          const { result: generatedObject } = await generatedImageResponse.json()
          console.log('generatedObject:', generatedObject)
          setValue(generatedObject)
          setModified(true)
          setMessage({
            label: '',
            message: '',
          })
          // await submit()
          //   .then((res) => {
          //     console.log('Form submitted:', res)
          //   })
          //   .catch((error) => {
          //     console.error('Error submitting form', error)
          //   })
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

  return instructions ? (
    <Actions
      CustomLabel={CustomLabel}
      instructions={instructions}
      label={label}
      labelProps={labelProps}
      onClickGenerate={regenerateObject}
    />
  ) : (
    CustomLabel
  )
}
