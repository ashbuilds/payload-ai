'use client'

import { SelectInput } from '@payloadcms/ui'
import type { OptionObject } from 'payload'
import React from 'react'

type Primitive = boolean | null | number | string | undefined
type PrimitiveArray = number[] | string[]

type ProviderOptionTreeNodeProps = {
  disabled?: boolean
  onChange: (path: string[], value: any) => void
  path: string[]
  schemaValue: Primitive | PrimitiveArray | Record<string, any>
  selectedValue: any
}

export const ProviderOptionsTree: React.FC<ProviderOptionTreeNodeProps> = ({
  disabled,
  onChange,
  path,
  schemaValue,
  selectedValue,
}) => {
  const nodeKey = path.length > 0 ? path[path.length - 1] : 'root'
  const inputId = `po-${path.join('-')}`

  // Ensure path is properly passed when nested deeper than 1 level
  if (schemaValue && typeof schemaValue === 'object' && !Array.isArray(schemaValue)) {
    return (
      <div className="provider-options-group" style={{ 
        borderLeft: path.length > 0 ? '1px solid var(--theme-elevation-150)' : 'none', 
        display: 'grid', 
        gap: '1rem', 
        marginLeft: path.length > 0 ? '1rem' : '0', 
        paddingLeft: path.length > 0 ? '1rem' : '0' 
      }}>
        {path.length > 0 && <div className="field-label" style={{ fontWeight: 600, marginBottom: '-0.5rem' }}>{nodeKey}</div>}
        {Object.entries(schemaValue).map(([key, childSchema]) => (
          <ProviderOptionsTree
            disabled={disabled}
            key={key}
            onChange={onChange}
            path={[...path, key]}
            schemaValue={childSchema as any}
            selectedValue={selectedValue?.[key]}
          />
        ))}
      </div>
    )
  }

  // Handle Array as Select Menu options
  if (Array.isArray(schemaValue)) {
    const options: OptionObject[] = schemaValue.map((item) => ({
      label: String(item),
      value: String(item),
    }))

    return (
      <div className="field-type select">
        <label className="field-label" htmlFor={inputId}>
          {nodeKey}
        </label>
        <SelectInput
          isClearable
          name={inputId}
          onChange={(selected) => {
            if (selected && typeof selected === 'object' && 'value' in selected) {
              onChange(path, (selected as OptionObject).value)
              return
            }
            onChange(path, undefined)
          }}
          options={options}
          path={inputId}
          readOnly={disabled}
          value={selectedValue !== undefined ? String(selectedValue) : undefined}
        />
      </div>
    )
  }

  // Handle Boolean as Select Menu True/False
  if (typeof schemaValue === 'boolean') {
    const booleanOptions: OptionObject[] = [
      { label: 'True', value: 'true' },
      { label: 'False', value: 'false' },
    ]
    const stringVal = selectedValue === true ? 'true' : selectedValue === false ? 'false' : undefined

    return (
      <div className="field-type select">
        <label className="field-label" htmlFor={inputId}>
          {nodeKey}
        </label>
        <SelectInput
          isClearable
          name={inputId}
          onChange={(selected) => {
            if (selected && typeof selected === 'object' && 'value' in selected) {
              onChange(path, (selected as OptionObject).value === 'true')
              return
            }
            onChange(path, undefined)
          }}
          options={booleanOptions}
          path={inputId}
          readOnly={disabled}
          value={stringVal}
        />
      </div>
    )
  }

  // Handle Number Input
  if (typeof schemaValue === 'number') {
    return (
      <div className="field-type number">
        <label className="field-label" htmlFor={inputId}>
          {nodeKey}
        </label>
        <input
          disabled={disabled}
          id={inputId}
          name={inputId}
          onChange={(e) => {
            const val = e.target.value
            onChange(path, val === '' ? undefined : Number(val))
          }}
          style={{ width: '100%' }}
          type="number"
          value={
            typeof selectedValue === 'number' && !Number.isNaN(selectedValue)
              ? Number(selectedValue)
              : ''
          }
        />
      </div>
    )
  }

  // Handle Text Input
  return (
    <div className="field-type text">
      <label className="field-label" htmlFor={inputId}>
        {nodeKey}
      </label>
      <input
        disabled={disabled}
        id={inputId}
        name={inputId}
        onChange={(e) => {
          const val = e.target.value
          onChange(path, val.trim() === '' ? undefined : val)
        }}
        style={{ width: '100%' }}
        type="text"
        value={typeof selectedValue === 'string' ? selectedValue : ''}
      />
    </div>
  )
}
