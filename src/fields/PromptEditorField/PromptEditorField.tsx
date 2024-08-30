'use client'

import type { TextareaFieldProps } from 'payload'
import type { ChangeEvent } from 'react'

import { TextareaInput, useField, useFieldProps, useForm } from '@payloadcms/ui'
import React, { useCallback, useEffect, useRef } from 'react'

import { useInstructions } from '../../providers/InstructionsProvider/hook.js'
import { Floatype } from '../../ui/Floatype/Floatype.js'

// Maybe try lexical editor instead?!
//TODO: HMR does not work for plugin components anymore, I think it has to do with importMap/ string path
//TODO: Display the handlebarjs tips in description
export const PromptEditorField: React.FC<TextareaFieldProps> = (props) => {
  const { field } = props
  const { path: pathFromContext } = useFieldProps()

  const elementRef = useRef<HTMLTextAreaElement>(null)
  const { fields } = useInstructions({
    path: pathFromContext,
  })

  const { path, setValue, value } = useField<string>({
    path: pathFromContext,
  })

  console.log('PromptEditorField:props : ', props)

  const { formRef, initializing } = useForm()

  useEffect(() => {
    if (!formRef.current || elementRef.current) return

    const fieldId = `#field-${path.replace(/\./g, '__')}`
    elementRef.current = formRef.current.querySelector(fieldId)
  }, [formRef, path])

  const handleQuery = useCallback(
    (val: string) => {
      if (val === '{{ ') return fields
      return fields.filter((field) => field.toLowerCase().includes(val.toLowerCase()))
    },
    [fields],
  )

  const handleSelect = useCallback(
    (value: string, query: string) => {
      if (query === '{{ ') return `${value} }}`
      return fields.includes(value) ? value : undefined
    },
    [fields],
  )

  const handleUpdate = useCallback(
    (value: string) => {
      if (value) setValue(value)
    },
    [setValue],
  )

  const CustomDescription = !initializing ? (
    <Floatype
      options={{
        onQuery: handleQuery,
        onSelect: handleSelect,
        onUpdate: handleUpdate,
      }}
      ref={elementRef}
    />
  ) : null

  console.log('CustomDescription :', CustomDescription)

  return (
    <TextareaInput
      Description={CustomDescription}
      label={field.label}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value)
      }}
      path={path}
      value={value}
    />
  )
}
