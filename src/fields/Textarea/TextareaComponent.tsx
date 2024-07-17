'use client'

import type { TextareaFieldProps } from '@payloadcms/ui'

import {
  Pill,
  TextareaField,
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

export const TextareaComponent: React.FC<TextareaFieldProps> = (props) => {
  const { name, CustomLabel, label, labelProps, locale, path: pathFromProps } = props

  const { instructions, noticeMessage } = useInstructions({
    path: pathFromProps,
  })

  const docInfo = useDocumentInfo()
  const { path: pathFromContext } = useFieldProps()
  const { setValue } = useField<string>({
    path: pathFromContext || pathFromProps || name,
  })
  const localFromContext = useLocale()
  const { getDotFields } = useDotFields()
  const generateText = useCallback(async () => {
    const { fields = {} } = getDotFields()
    if (!Object.keys(fields).length) {
      console.log('dotFields is empty')
      return
    }
    const generatedTextResponse = await fetch('/api/ai/generate/textarea', {
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

    const { result: generatedText } = await generatedTextResponse.json()

    setValue(generatedText)
  }, [getDotFields, docInfo, localFromContext?.code, locale?.code, instructions?.id, setValue])

  return (
    <div className="field-type">
      <TextareaField
        {...props}
        CustomLabel={
          instructions ? (
            <Actions
              CustomLabel={CustomLabel}
              instructions={instructions}
              label={label}
              labelProps={labelProps}
              onClickGenerate={generateText}
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
