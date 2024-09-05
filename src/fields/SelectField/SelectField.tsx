'use client'

import type { OptionObject, SelectFieldProps } from 'payload'

import { SelectInput, useField, useFieldProps } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

// Use to filter model options in settings based on field types
export const SelectField = (
  props: {
    filterByField: string
    options: { fields: string[]; label: string; value: string }[]
  } & SelectFieldProps,
) => {
  const { field, filterByField, options } = props
  const { path } = useFieldProps()
  const { value: relatedField } = useField<string>({
    path: filterByField,
  })

  const [filterOptions, setFilterOptions] = useState<OptionObject[]>([])

  useEffect(() => {
    if (!Array.isArray(options)) return

    const opts = options.filter((option) => {
      if (!relatedField || !option.fields) return true

      if (Array.isArray(option.fields)) {
        return option.fields.includes(relatedField)
      }
    })
    setFilterOptions(opts)
  }, [relatedField, options])

  const { setValue, value: selectValue } = useField<string>({ path })

  return (
    <SelectInput
      label={field.label}
      name={path}
      onChange={(e: OptionObject) => {
        setValue(e.value)
      }}
      options={filterOptions}
      path={path}
      value={selectValue}
    />
  )
}
