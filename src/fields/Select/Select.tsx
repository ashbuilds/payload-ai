'use client'

import type { SelectFieldProps } from '@payloadcms/ui'
import type { Option } from 'payload'

import { SelectField, useField, useFieldProps, useForm } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

export const Select = (props: SelectFieldProps) => {
  const fieldProps = useFieldProps()

  const { custom: selectOptions, path } = fieldProps
  const { options: optionsFromProps = [] } = props
  const { filterByField, options } = selectOptions

  // const { value: selectedValue } = useField({
  //   path: props.path || path,
  // })

  const { value } = useField({
    path: filterByField,
  })
  const [filterOptions, setFilterOptions] = useState<Option[]>([])

  //TODO: Remove this mess, find alternative
  useEffect(() => {
    if (Array.isArray(options)) {
      const opts = options.filter((option) => {
        if (!value || !option.fields) return true

        if (Array.isArray(option.fields)) {
          return option.fields.includes(value)
        }
      })
      setFilterOptions(opts)
    } else {
      setFilterOptions(optionsFromProps)
    }
  }, [value, optionsFromProps, options])

  // useEffect(() => {
  //   if (Array.isArray(options)) {
  //     console.log('selected:', selectedValue)
  //     const selectedOption = options.find((option) => option.value === selectedValue)
  //     console.log('selectedOption', selectedOption)
  //   }
  // }, [options, selectedValue])

  return <SelectField {...props} options={filterOptions} />
}
