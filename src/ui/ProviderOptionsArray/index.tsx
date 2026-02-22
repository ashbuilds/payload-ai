'use client'

import React, { useEffect, useMemo } from 'react'
import { ArrayField, useField, useForm, useFormFields } from '@payloadcms/ui'
import type { ArrayFieldClientComponent } from 'payload'

const StatusMessage: React.FC<{ label: string; message: string; path: string }> = ({
  label,
  message,
  path,
}) => (
  <div className="field-type text">
    <label className="field-label" htmlFor={path}>
      {label}
    </label>
    <p style={{ color: 'var(--theme-elevation-600)', fontSize: '13px' }}>{message}</p>
  </div>
)

export const ProviderOptionsArray: ArrayFieldClientComponent = (props) => {
  const { field, path } = props

  const parentPath = useMemo(() => path.split('.').slice(0, -1).join('.'), [path])
  const providerPath = useMemo(() => `${parentPath}.provider`, [parentPath])

  const providerField = useFormFields(([fields]) => fields?.[providerPath])
  const providerValue = (providerField?.value as string) || ''

  const { rows = [] } = useField({
    hasRows: true,
    potentiallyStalePath: path,
  })

  const { dispatchFields, setModified } = useForm()

  const providerFields = useFormFields(([fields]) => {
    if (!fields || typeof fields !== 'object') return {}
    const result: Record<string, any> = {}
    const prefix = `${path}.`
    Object.keys(fields).forEach((key) => {
      if (key.startsWith(prefix) && key.endsWith('.provider')) {
        result[key] = fields[key]
      }
    })
    return result
  })

  useEffect(() => {
    if (!providerValue || rows.length === 0) return

    rows.forEach((_, index) => {
      const rowProviderPath = `${path}.${index}.provider`
      const rowProvider = providerFields[rowProviderPath]?.value as string | undefined
      if (!rowProvider) {
        dispatchFields({ type: 'UPDATE', path: rowProviderPath, value: providerValue })
        setModified(true)
      }
    })
  }, [dispatchFields, providerFields, path, providerValue, rows, setModified])

  const hiddenRowStyle = useMemo(() => {
    if (!providerValue || rows.length === 0) return ''

    const rowIdBase = path.split('.').join('-')
    const selectors: string[] = []

    rows.forEach((_, index) => {
      const rowProviderPath = `${path}.${index}.provider`
      const rowProvider = providerFields[rowProviderPath]?.value as string | undefined
      if (!rowProvider || rowProvider !== providerValue) {
        selectors.push(`#${rowIdBase}-row-${index}`)
      }
    })

    if (selectors.length === 0) return ''
    return `${selectors.join(', ')} { display: none; }`
  }, [path, providerFields, providerValue, rows])

  if (!providerValue) {
    return (
      <StatusMessage
        label={(field?.label as string) || 'Provider Options'}
        message="Select a provider to manage provider-specific options."
        path={path}
      />
    )
  }

  return (
    <div>
      <ArrayField {...props} />
      {hiddenRowStyle ? <style>{hiddenRowStyle}</style> : null}
    </div>
  )
}
