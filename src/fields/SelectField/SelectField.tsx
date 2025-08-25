'use client'

import type { OptionObject, SelectFieldClientProps } from 'payload'

import { SelectInput, useField } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

// Use to filter model options in settings based on field types
export const SelectField = (
  props: {
    filterByField: string
    options: { fields: string[]; label: string; value: string }[]
    path: string
  } & SelectFieldClientProps,
) => {
  const { field, filterByField, options, path } = props
  const { value: relatedField } = useField<string>({
    path: filterByField,
  })

  const [filterOptions, setFilterOptions] = useState<OptionObject[]>([])

  useEffect(() => {
    if (!Array.isArray(options)) {
      return
    }

    const opts = options.filter((option) => {
      if (!relatedField || !option.fields) {
        return true
      }

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
      onChange={(value) => {
        console.log("value --- ", value)
        if (Array.isArray(value)) {
          setValue(value[0]?.value ?? '')
        } else if (value && typeof value === 'object' && 'value' in value) {
          setValue((value as OptionObject).value)
        } else {
          setValue('')
        }
      }}
      options={filterOptions}
      path={path}
      value={selectValue}
    />
  )
}
