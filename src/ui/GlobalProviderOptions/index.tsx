'use client'

import type { FieldClientComponent } from 'payload'

import { useField, useFormFields } from '@payloadcms/ui'
import * as React from 'react'
import { useCallback } from 'react'

import { ProviderOptionsTree } from '../InstructionProviderOptions/ProviderOptionsTree.js'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function cloneRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {}
  }

  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
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
      if (!provider || keyPath.length === 0) {
        return
      }

      const nextProviderOptions = cloneRecord(providerOptionsValue)
      const currentProviderOptions = isRecord(nextProviderOptions[provider])
        ? cloneRecord(nextProviderOptions[provider])
        : {}

      const finalKey = keyPath[keyPath.length - 1]

      if (targetValue === undefined) {
        const parentRefs: Array<{ key: string; node: Record<string, unknown> }> = []
        let targetNode: Record<string, unknown> | undefined = currentProviderOptions

        for (let i = 0; i < keyPath.length - 1; i++) {
          const segment = keyPath[i]
          if (!targetNode || !isRecord(targetNode[segment])) {
            targetNode = undefined
            break
          }
          parentRefs.push({ key: segment, node: targetNode })
          targetNode = targetNode[segment] as Record<string, unknown>
        }

        if (targetNode) {
          delete targetNode[finalKey]
          for (let i = parentRefs.length - 1; i >= 0; i--) {
            const { key, node } = parentRefs[i]
            if (isRecord(node[key]) && Object.keys(node[key]).length === 0) {
              delete node[key]
            }
          }
        }
      } else {
        let targetNode = currentProviderOptions
        for (let i = 0; i < keyPath.length - 1; i++) {
          const segment = keyPath[i]
          if (!isRecord(targetNode[segment])) {
            targetNode[segment] = {}
          }
          targetNode = targetNode[segment] as Record<string, unknown>
        }
        targetNode[finalKey] = targetValue
      }

      if (Object.keys(currentProviderOptions).length === 0) {
        delete nextProviderOptions[provider]
      } else {
        nextProviderOptions[provider] = currentProviderOptions
      }

      setProviderOptionsValue(Object.keys(nextProviderOptions).length > 0 ? nextProviderOptions : null)
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
