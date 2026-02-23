'use client'

import type { FieldClientComponent } from 'payload'

import { useField, useFormFields } from '@payloadcms/ui'
import * as React from 'react'
import { useCallback, useMemo } from 'react'

import { useAISettings } from '../hooks/useAISettings.js'
import { ProviderOptionsTree } from './ProviderOptionsTree.js'

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

  // 1. Find the provider's schema for this use case
  const schema = useMemo(() => {
    if (!provider || !aiSettings?.defaults) {
      return null
    }
    const useCaseDefaults = (aiSettings.defaults as Record<string, unknown>)[useCase] as Record<
      string,
      unknown
    >
    // We stored the raw schema object directly under schemas[provider] during autoSetup
    const schemas = useCaseDefaults?.schema as Record<string, unknown> | undefined
    return schemas?.[provider] || null
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

  const handleOptionChange = useCallback(
    (keyPath: string[], targetValue: unknown) => {
      // Need provider wrapping, e.g., { google: { imageConfig: { aspectRatio: '1:1' } } }
      const currentVal = (providerOptionsValues as Record<string, unknown>) || {}

      // Clone securely
      const nextProviderOptions = JSON.parse(JSON.stringify(currentVal)) as Record<
        string,
        Record<string, unknown>
      >
      if (!provider) {
        return
      }
      if (!nextProviderOptions[provider]) {
        nextProviderOptions[provider] = {}
      }

      // Deep set logic explicitly for the selected provider
      let target = nextProviderOptions[provider]
      for (let i = 0; i < keyPath.length - 1; i++) {
        const seg = keyPath[i]
        if (!target[seg]) {
          target[seg] = {}
        }
        target = target[seg] as Record<string, unknown>
      }

      const finalKey = keyPath[keyPath.length - 1]
      if (targetValue === undefined) {
        delete target[finalKey]
      } else {
        target[finalKey] = targetValue
      }

      setProviderOptionsValues(
        Object.keys(nextProviderOptions).length > 0 ? nextProviderOptions : null,
      )
    },
    [providerOptionsValues, provider, setProviderOptionsValues],
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

  if (!schema || typeof schema !== 'object' || Object.keys(schema).length === 0) {
    return (
      <div className="field-type" style={{ marginTop: '1rem' }}>
        <div className="field-label">Provider Options</div>
        <p style={{ color: 'var(--theme-elevation-500)', margin: 0 }}>
          No provider options are configured for this provider and capability.
        </p>
      </div>
    )
  }

  const selectedProviderValues = (providerOptionsValues as Record<string, any>)?.[provider] || {}

  return (
    <div className="field-type" style={{ marginTop: '1rem' }}>
      <div className="field-label">Provider Options</div>
      <p style={{ color: 'var(--theme-elevation-500)', marginBottom: '0.75rem', marginTop: 0 }}>
        Override {providerLabel || provider} provider options for this field.
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
