'use client'

import type { TextareaFieldProps } from '@payloadcms/ui'

import { TextareaField as InputField, useField, useFieldProps, useForm } from '@payloadcms/ui'
import React, { useCallback, useEffect, useRef } from 'react'

import { useInstructions } from '../../providers/InstructionsProvider/hook.js'
import { Floatype } from '../../ui/Floatype/Floatype.js'

export const PromptTextareaField: React.FC<TextareaFieldProps> = (props) => {
  const { name, path: pathFromProps, ...restProps } = props
  const { path: pathFromContext } = useFieldProps()

  const elementRef = useRef<HTMLTextAreaElement>(null)
  const { fields } = useInstructions({
    path: pathFromProps,
  })

  const { path, setValue } = useField<string>({
    path: pathFromContext || pathFromProps || name,
  })

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

  return (
    <InputField
      {...restProps}
      CustomDescription={CustomDescription}
      name={name}
      path={pathFromProps}
    />
  )
}
