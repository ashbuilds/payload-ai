'use client'

import type { ClientField, FieldClientComponent } from 'payload'

import { RenderFields, useAllFormFields, useForm, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useMemo } from 'react'

import { providerFieldKey } from '../../utilities/ai/resolveEffectiveInstructionSettings.js'
import { useAISettings } from '../hooks/useAISettings.js'

type ProviderOptionRow = {
  key: string
  type: 'boolean' | 'number' | 'options' | 'text'
  valueBoolean?: boolean
  valueNumber?: number
  valueOptions?: string[]
  valueText?: string
}

type OptionDefinition = {
  fieldName: string
  key: string
  options?: string[]
  type: ProviderOptionRow['type']
}

function inferUseCase(fieldPath: string): 'image' | 'text' | 'tts' | 'video' {
  const parentName = fieldPath.split('.').slice(-2)[0]

  if (parentName === 'image-settings') {
    return 'image'
  }
  if (parentName === 'tts-settings') {
    return 'tts'
  }
  if (parentName === 'video-settings') {
    return 'video'
  }

  return 'text'
}

function sanitizeKey(value: string): string {
  return String(value).replace(/\W+/g, '_')
}

function getRowValue(row: ProviderOptionRow | undefined, type: OptionDefinition['type']): unknown {
  if (!row) {
    return undefined
  }

  if (type === 'boolean') {
    if (row.type === 'boolean') {
      return !!row.valueBoolean
    }
    return undefined
  }

  if (type === 'number') {
    if (row.type === 'number') {
      return row.valueNumber
    }
    if (row.type === 'text' && row.valueText) {
      const parsed = Number(row.valueText)
      return Number.isNaN(parsed) ? undefined : parsed
    }
    return undefined
  }

  if (type === 'text') {
    if (row.type === 'text') {
      return row.valueText
    }
    if (row.type === 'options' && Array.isArray(row.valueOptions)) {
      return row.valueOptions[0]
    }
    return undefined
  }

  if (row.type === 'text') {
    return row.valueText
  }

  if (row.type === 'options' && Array.isArray(row.valueOptions)) {
    return row.valueOptions[0]
  }

  return undefined
}

function normalizeRows(rows: ProviderOptionRow[]): ProviderOptionRow[] {
  return [...rows]
    .filter((row) => !!row?.key)
    .sort((a, b) => a.key.localeCompare(b.key))
}

export const InstructionProviderOptions: FieldClientComponent = ({ path }) => {
  const { dispatchFields } = useForm()
  const [allFields] = useAllFormFields()
  const { data: aiSettings } = useAISettings()

  const fieldPath = (path as string) || ''
  const groupPath = fieldPath.split('.').slice(0, -1).join('.')
  const providerPath = `${groupPath}.provider`
  const useCase = useMemo(() => inferUseCase(fieldPath), [fieldPath])

  const providerField = useFormFields(([fields]) => fields[providerPath])
  const provider = providerField?.value as string | undefined

  const storagePath = provider ? `${groupPath}.${providerFieldKey(provider)}` : ''
  const storageField = useFormFields(([fields]) => (storagePath ? fields[storagePath] : undefined))
  const selectedRows = useMemo<ProviderOptionRow[]>(() => {
    const value = storageField?.value
    if (!Array.isArray(value)) {
      return []
    }

    return value.filter(
      (row): row is ProviderOptionRow =>
        !!row && typeof row === 'object' && 'key' in row && 'type' in row,
    )
  }, [storageField?.value])

  const optionDefinitions = useMemo(() => {
    if (!provider) {
      return [] as OptionDefinition[]
    }

    const defaults = (aiSettings?.defaults || {}) as Record<string, unknown>
    const useCaseDefaults = (defaults[useCase] || {}) as Record<string, unknown>
    const poKey = providerFieldKey(provider)
    const rows = useCaseDefaults[poKey]

    if (!Array.isArray(rows)) {
      return [] as OptionDefinition[]
    }

    return (rows as ProviderOptionRow[])
      .filter((row) => row?.key && row?.type)
      .map((row) => ({
        type: row.type,
        fieldName: sanitizeKey(row.key),
        key: row.key,
        options: row.type === 'options' && Array.isArray(row.valueOptions)
          ? row.valueOptions.map((item) => String(item))
          : undefined,
      }))
  }, [aiSettings, provider, useCase])

  const selectedByKey = useMemo(() => {
    const map = new Map<string, ProviderOptionRow>()
    for (const row of selectedRows) {
      if (row?.key) {
        map.set(row.key, row)
      }
    }
    return map
  }, [selectedRows])

  const dynamicFields = useMemo(() => {
    const fields: Record<string, unknown>[] = []

    for (const option of optionDefinitions) {
      const existing = selectedByKey.get(option.key)
      const defaultValue = getRowValue(existing, option.type)

      if (option.type === 'text') {
        fields.push({
          name: option.fieldName,
          type: 'text',
          defaultValue: defaultValue as string | undefined,
          label: option.key,
        })
        continue
      }

      if (option.type === 'number') {
        fields.push({
          name: option.fieldName,
          type: 'number',
          defaultValue: defaultValue as number | undefined,
          label: option.key,
        })
        continue
      }

      if (option.type === 'boolean') {
        fields.push({
          name: option.fieldName,
          type: 'checkbox',
          defaultValue: defaultValue as boolean | undefined,
          label: option.key,
        })
        continue
      }

      fields.push({
        name: option.fieldName,
        type: 'select',
        admin: {
          isClearable: true,
        },
        defaultValue: (defaultValue as string | undefined) || undefined,
        label: option.key,
        options: (option.options || []).map((value) => ({
          label: value,
          value,
        })),
      })
    }

    return fields
  }, [optionDefinitions, selectedByKey])

  const virtualPath = useMemo(() => {
    if (!provider) {
      return `${groupPath}.providerOptionsForm`
    }
    return `${groupPath}.providerOptionsForm.${sanitizeKey(provider)}`
  }, [groupPath, provider])

  useEffect(() => {
    if (!storagePath || optionDefinitions.length === 0) {
      return
    }

    const nextRows: ProviderOptionRow[] = []

    for (const option of optionDefinitions) {
      const fieldState = allFields[`${virtualPath}.${option.fieldName}`] as
        | { value?: unknown }
        | undefined
      const value = fieldState?.value

      if (option.type === 'text') {
        if (typeof value === 'string' && value.trim() !== '') {
          nextRows.push({
            type: 'text',
            key: option.key,
            valueText: value,
          })
        }
        continue
      }

      if (option.type === 'number') {
        if (typeof value === 'number' && !Number.isNaN(value)) {
          nextRows.push({
            type: 'number',
            key: option.key,
            valueNumber: value,
          })
        }
        continue
      }

      if (option.type === 'boolean') {
        if (typeof value === 'boolean') {
          nextRows.push({
            type: 'boolean',
            key: option.key,
            valueBoolean: value,
          })
        }
        continue
      }

      if (typeof value === 'string' && value.trim() !== '') {
        nextRows.push({
          type: 'options',
          key: option.key,
          valueOptions: [value],
        })
      }
    }

    const normalizedNext = normalizeRows(nextRows)
    const normalizedCurrent = normalizeRows(selectedRows)

    if (JSON.stringify(normalizedNext) === JSON.stringify(normalizedCurrent)) {
      return
    }

    dispatchFields({
      type: 'UPDATE',
      path: storagePath,
      value: normalizedNext,
    } as never)
  }, [allFields, dispatchFields, optionDefinitions, selectedRows, storagePath, virtualPath])

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

  if (dynamicFields.length === 0) {
    return (
      <div className="field-type" style={{ marginTop: '1rem' }}>
        <div className="field-label">Provider Options</div>
        <p style={{ color: 'var(--theme-elevation-500)', margin: 0 }}>
          No provider options are configured for this provider and capability.
        </p>
      </div>
    )
  }

  return (
    <div className="field-type" style={{ marginTop: '1rem' }}>
      <div className="field-label">Provider Options</div>
      <p style={{ color: 'var(--theme-elevation-500)', marginBottom: '0.75rem', marginTop: 0 }}>
        Adjust values to override provider options for this field.
      </p>

      <RenderFields
        fields={dynamicFields as ClientField[]}
        margins="small"
        parentIndexPath=""
        parentPath={virtualPath}
        parentSchemaPath={virtualPath}
        permissions={true as never}
      />
    </div>
  )
}
