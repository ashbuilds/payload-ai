'use client'

import type { TextareaFieldProps } from 'payload'
// import type { ChangeEvent } from 'react'

import {
  FieldLabel,
  TextareaInput,
  useConfig,
  useField,
  useFieldComponents,
  useFieldProps,
  useForm,
  useFormFields,
} from '@payloadcms/ui'
// import { Textcomplete } from '@textcomplete/core'
// import { TextareaEditor } from '@textcomplete/textarea'
import { ChangeEvent, useState } from 'react'
import React, { use, useCallback, useEffect, useRef } from 'react'

import { handlebarsHelpers, handlebarsHelpersMap } from '../../handlebars/helpersMap.js'
import { useInstructions } from '../../providers/InstructionsProvider/hook.js'
import { getFieldBySchemaPath } from '../../utilities/getFieldBySchemaPath.js'
import { AutocompleteTextField } from './AutocompleteTextArea.js'

// Maybe try lexical editor instead?!
//TODO: HMR does not work for plugin components anymore, I think it has to do with importMap/ string path
//TODO: Display the handlebarjs tips in description
export const PromptEditorField: React.FC<TextareaFieldProps> = (props) => {
  const { field } = props
  const { path: pathFromContext } = useFieldProps()

  const elementRef = useRef<HTMLTextAreaElement>(null)
  const { fields, map: fieldsMap } = useInstructions({
    path: pathFromContext,
  })

  const { path, setValue, value } = useField<string>({
    path: pathFromContext,
  })

  const { formRef, getField, initializing } = useForm()

  useEffect(() => {
    if (!formRef.current || elementRef.current) return

    const fieldId = `#field-${path.replace(/\./g, '__')}`
    elementRef.current = formRef.current.querySelector(fieldId)
  }, [formRef, path])

  const opts = [...fields].reduce((acc, f) => {
    const fieldKey = Object.keys(fieldsMap).find((k) => k.endsWith(f))
    const fieldInfo = fieldsMap[fieldKey]

    const helpers = handlebarsHelpers.filter(
      (h) => handlebarsHelpersMap[h]?.field === fieldInfo.fieldType,
    )

    if (helpers.length) {
      for (const helper of helpers) {
        acc.push(helper + ` ${f}`)
      }
      return acc
    }

    acc.push(f)
    return acc
  }, [])

  return (
    <div className="field-type textarea">
      <FieldLabel field={field} label={field.label} />
      <AutocompleteTextField
        changeOnSelect={(trigger, selected) => {
          if (handlebarsHelpers.includes(selected.trim())) {
            return trigger + selected
          }

          return trigger + selected + ' }}'
        }}
        onChange={(val: string) => {
          setValue(val)
        }}
        options={opts}
        trigger={['{{ ', ...handlebarsHelpers.map((h) => `{{ ${h}  `)]}
        value={value}
      />
    </div>
  )
}
