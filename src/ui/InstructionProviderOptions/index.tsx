'use client'

import type { FieldClientComponent, OptionObject } from 'payload'

import { SelectInput, useField, useFormFields } from '@payloadcms/ui'
import React, { useMemo } from 'react'

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
  key: string
  options: string[]
  type: ProviderOptionRow['type']
}

type ProviderOptionValueMap = Record<string, boolean | number | string>

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

function sanitizeIdSegment(value: string): string {
  return value.replace(/\W+/g, '_')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function toScalarRowValue(row: ProviderOptionRow): boolean | number | string | undefined {
  if (row.type === 'boolean') {
    return typeof row.valueBoolean === 'boolean' ? row.valueBoolean : undefined
  }

  if (row.type === 'number') {
    return typeof row.valueNumber === 'number' && !Number.isNaN(row.valueNumber)
      ? row.valueNumber
      : undefined
  }

  if (row.type === 'options') {
    if (Array.isArray(row.valueOptions) && row.valueOptions.length > 0) {
      return String(row.valueOptions[0])
    }
    return undefined
  }

  if (typeof row.valueText === 'string' && row.valueText.trim() !== '') {
    return row.valueText
  }

  return undefined
}

function normalizeStoredValue(
  value: unknown,
): ProviderOptionValueMap {
  if (isRecord(value)) {
    const normalized: ProviderOptionValueMap = {}

    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry === 'string') {
        if (entry.trim() !== '') {
          normalized[key] = entry
        }
        continue
      }

      if (typeof entry === 'number') {
        if (!Number.isNaN(entry)) {
          normalized[key] = entry
        }
        continue
      }

      if (typeof entry === 'boolean') {
        normalized[key] = entry
      }
    }

    return normalized
  }

  if (Array.isArray(value)) {
    const normalized: ProviderOptionValueMap = {}

    for (const row of value) {
      if (!row || typeof row !== 'object') {
        continue
      }

      const castRow = row as ProviderOptionRow
      if (!castRow.key) {
        continue
      }

      const scalar = toScalarRowValue(castRow)
      if (scalar !== undefined) {
        normalized[castRow.key] = scalar
      }
    }

    return normalized
  }

  return {}
}

function normalizeValueForType({
  type,
  raw,
}: {
  raw: unknown
  type: ProviderOptionRow['type']
}): boolean | number | string | undefined {
  if (type === 'boolean') {
    if (raw === true || raw === false) {
      return raw
    }
    return undefined
  }

  if (type === 'number') {
    if (typeof raw === 'number' && !Number.isNaN(raw)) {
      return raw
    }

    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (trimmed === '') {
        return undefined
      }

      const parsed = Number(trimmed)
      if (!Number.isNaN(parsed)) {
        return parsed
      }
    }

    return undefined
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    return trimmed === '' ? undefined : trimmed
  }

  return undefined
}

export const InstructionProviderOptions: FieldClientComponent = ({ path }) => {
  const { data: aiSettings } = useAISettings()

  const fieldPath = (path as string) || ''
  const groupPath = fieldPath.split('.').slice(0, -1).join('.')
  const providerPath = `${groupPath}.provider`
  const useCase = useMemo(() => inferUseCase(fieldPath), [fieldPath])

  const providerField = useFormFields(([fields]) => fields[providerPath])
  const provider = providerField?.value as string | undefined

  const { setValue: setProviderOptionsValues, value: providerOptionsValues } = useField<unknown>({
    path: fieldPath,
  })

  const selectedByKey = useMemo(
    () => normalizeStoredValue(providerOptionsValues),
    [providerOptionsValues],
  )

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

    return rows
      .filter(
        (row): row is ProviderOptionRow =>
          !!row && typeof row === 'object' && 'key' in row && 'type' in row,
      )
      .filter((row) => row.key && row.type)
      .map((row) => ({
        type: row.type,
        key: row.key,
        options:
          row.type === 'options' && Array.isArray(row.valueOptions)
            ? row.valueOptions.map((item) => String(item))
            : [],
      }))
  }, [aiSettings, provider, useCase])

  const providerLabel = useMemo(() => {
    if (!provider) {
      return undefined
    }

    const providers = Array.isArray(aiSettings?.providers) ? aiSettings.providers : []
    const configuredProvider = providers.find(
      (item) =>
        item &&
        typeof item === 'object' &&
        'blockType' in item &&
        (item as { blockType?: unknown }).blockType === provider,
    ) as { providerName?: string } | undefined

    if (configuredProvider?.providerName) {
      return configuredProvider.providerName
    }

    return provider
  }, [aiSettings?.providers, provider])

  const setOptionValue = ({
    type,
    key,
    raw,
  }: {
    key: string
    raw: unknown
    type: ProviderOptionRow['type']
  }) => {
    const normalized = normalizeValueForType({ type, raw })
    const current = normalizeStoredValue(providerOptionsValues)
    const next: ProviderOptionValueMap = { ...current }

    if (normalized === undefined) {
      delete next[key]
    } else {
      next[key] = normalized
    }

    setProviderOptionsValues(Object.keys(next).length > 0 ? next : null)
  }

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

  if (optionDefinitions.length === 0) {
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
        Override {providerLabel || provider} provider options for this field.
      </p>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {optionDefinitions.map((option) => {
          const selectedValue = selectedByKey[option.key]
          const inputId = `${fieldPath}-${sanitizeIdSegment(option.key)}`
          const inputPath = `${fieldPath}.${sanitizeIdSegment(option.key)}`

          if (option.type === 'text') {
            return (
              <div className="field-type text" key={option.key}>
                <label className="field-label" htmlFor={inputId}>
                  {option.key}
                </label>
                <input
                  aria-label={option.key}
                  id={inputId}
                  name={inputPath}
                  onChange={(event) =>
                    setOptionValue({
                      type: option.type,
                      key: option.key,
                      raw: event.target.value,
                    })
                  }
                  style={{ width: '100%' }}
                  type="text"
                  value={typeof selectedValue === 'string' ? selectedValue : ''}
                />
              </div>
            )
          }

          if (option.type === 'number') {
            const numberValue =
              typeof selectedValue === 'number' && !Number.isNaN(selectedValue)
                ? String(selectedValue)
                : ''

            return (
              <div className="field-type number" key={option.key}>
                <label className="field-label" htmlFor={inputId}>
                  {option.key}
                </label>
                <input
                  aria-label={option.key}
                  id={inputId}
                  name={inputPath}
                  onChange={(event) =>
                    setOptionValue({
                      type: option.type,
                      key: option.key,
                      raw: event.target.value,
                    })
                  }
                  style={{ width: '100%' }}
                  type="number"
                  value={numberValue}
                />
              </div>
            )
          }

          if (option.type === 'boolean') {
            const booleanValue =
              selectedValue === true ? 'true' : selectedValue === false ? 'false' : undefined
            const booleanOptions: OptionObject[] = [
              { label: 'True', value: 'true' },
              { label: 'False', value: 'false' },
            ]

            return (
              <div className="field-type select" key={option.key}>
                <label className="field-label" htmlFor={inputId}>
                  {option.key}
                </label>
                <SelectInput
                  isClearable
                  name={inputPath}
                  onChange={(selected) => {
                    if (selected && typeof selected === 'object' && 'value' in selected) {
                      setOptionValue({
                        type: option.type,
                        key: option.key,
                        raw: (selected as OptionObject).value === 'true',
                      })
                      return
                    }

                    setOptionValue({ type: option.type, key: option.key, raw: undefined })
                  }}
                  options={booleanOptions}
                  path={inputPath}
                  value={booleanValue}
                />
              </div>
            )
          }

          const selectedOption = typeof selectedValue === 'string' ? selectedValue : undefined
          const selectOptions: OptionObject[] = option.options.map((value) => ({
            label: value,
            value,
          }))

          return (
            <div className="field-type select" key={option.key}>
              <label className="field-label" htmlFor={inputId}>
                {option.key}
              </label>
              <SelectInput
                isClearable
                name={inputPath}
                onChange={(selected) => {
                  if (selected && typeof selected === 'object' && 'value' in selected) {
                    setOptionValue({
                      type: option.type,
                      key: option.key,
                      raw: (selected as OptionObject).value,
                    })
                    return
                  }

                  setOptionValue({ type: option.type, key: option.key, raw: undefined })
                }}
                options={selectOptions}
                path={inputPath}
                value={selectedOption}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
