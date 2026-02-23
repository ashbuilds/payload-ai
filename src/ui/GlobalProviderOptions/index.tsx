'use client'

import type { FieldClientComponent } from 'payload'

import { useField, useFormFields } from '@payloadcms/ui'
import * as React from 'react'
import { useCallback } from 'react'

import { ProviderOptionsTree } from '../InstructionProviderOptions/ProviderOptionsTree.js'
import { updateProviderOptionsValue } from '../providerOptions/updateProviderOptionsValue.js'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

export const GlobalProviderOptions: FieldClientComponent = ({ path }) => {
  const fieldPath = String(path || '')
  const groupPath = fieldPath.split('.').slice(0, -1).join('.')
  const providerPath = `${groupPath}.provider`
  const schemaPath = `${groupPath}.schema`

  const providerField = useFormFields(([fields]) => fields[providerPath])
  const schemaField = useFormFields(([fields]) => fields[schemaPath])
  const provider = typeof providerField?.value === 'string' ? providerField.value : undefined

  const schemaByProvider = isRecord(schemaField?.value) ? schemaField.value : {}
  const schema = provider && isRecord(schemaByProvider[provider]) ? schemaByProvider[provider] : null

  const { setValue: setProviderOptionsValue, value: providerOptionsValue } = useField<unknown>({
    path: fieldPath,
  })

  const handleOptionChange = useCallback(
    (keyPath: string[], targetValue: unknown) => {
      const nextValue = updateProviderOptionsValue({
        currentValue: providerOptionsValue,
        keyPath,
        provider,
        targetValue,
      })
      setProviderOptionsValue(nextValue)
    },
    [provider, providerOptionsValue, setProviderOptionsValue],
  )

  if (!provider) {
    return (
      <div className="field-type" style={{ marginTop: '1rem' }}>
        <div className="field-label">Provider Options</div>
        <p style={{ color: 'var(--theme-elevation-500)', margin: 0 }}>
          Select a provider to configure provider options.
        </p>
      </div>
    )
  }

  if (!schema || Object.keys(schema).length === 0) {
    return (
      <div className="field-type" style={{ marginTop: '1rem' }}>
        <div className="field-label">Provider Options</div>
        <p style={{ color: 'var(--theme-elevation-500)', margin: 0 }}>
          No provider options schema exists for this provider and capability.
        </p>
      </div>
    )
  }

  const selectedProviderValues =
    isRecord(providerOptionsValue) && isRecord(providerOptionsValue[provider])
      ? providerOptionsValue[provider]
      : {}

  return (
    <div className="field-type" style={{ marginTop: '1rem' }}>
      <div className="field-label">Provider Options</div>
      <p style={{ color: 'var(--theme-elevation-500)', marginBottom: '0.75rem', marginTop: 0 }}>
        Configure default provider options for {provider}.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <ProviderOptionsTree
          onChange={handleOptionChange}
          path={[]}
          schemaValue={schema}
          selectedValue={selectedProviderValues}
        />
      </div>
    </div>
  )
}
