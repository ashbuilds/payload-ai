'use client'

import { UploadFieldProps, useForm, FieldComponentProps, SelectFieldProps, TextareaFieldProps } from '@payloadcms/ui'

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
import {LabelProps} from "payload";

export const SmartLabelComponent: React.FC<{
  schemaPath: string
} & LabelProps> = (props) => {
  const {
    CustomLabel,
    label,
    schemaPath: pathFromProps,
  } = props

  // console.log('SmartLabelComponent props:', props)

  const { instructions, noticeMessage, setMessage } = useInstructions({
    path: pathFromProps,
  })

  const docInfo = useDocumentInfo()
  const { path: pathFromContext } = useFieldProps()
  const { getData, getDataByPath, getSiblingData, setModified } = useForm()
  const { setValue, path: fieldPath } = useField<string>({
    path: pathFromContext || pathFromProps,
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
        locale: localFromContext?.code,
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
      .then(async (generatedResponse) => {
        if (generatedResponse.ok) {
          const { result } = await generatedResponse.json()
          console.log('generatedResult:', result)
          setValue(result)
          setModified(true)
          setMessage({
            label: '',
            message: '',
          })
        } else {
          const { errors = [] } = await generatedResponse.json()
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
    instructions?.id,
    setValue,
    setMessage,
  ])

  return <Actions
      CustomLabel={CustomLabel}
      instructions={instructions}
      label={label}
      labelProps={props}
      onClickGenerate={regenerateObject}
  />
}
