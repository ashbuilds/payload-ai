'use client'

import type { TextFieldClientProps } from 'payload'

import { SelectInput, TextInput, useConfig, useField } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import { PLUGIN_MODELS_ENDPOINT } from '../../defaults.js'

type ModelOption = {
  id: string
  label: string
  maxOutputTokens?: number
  structuredOutputs?: boolean
}

type DiscoveryResult = {
  message?: string
  models: ModelOption[]
  source: 'fallback' | 'live'
}

type ModelFieldProps = {
  fallbackOptions: ({ label: string; value: string } | string)[]
  provider: 'anthropic' | 'openai'
} & TextFieldClientProps

export const ModelField = ({ fallbackOptions, field, path, provider, readOnly }: ModelFieldProps) => {
  const {
    config: {
      routes: { api },
    },
  } = useConfig()
  const {
    disabled,
    path: fieldPath,
    setValue,
    showError,
    value,
  } = useField<string>({ potentiallyStalePath: path })
  const url = `${api}${PLUGIN_MODELS_ENDPOINT}?provider=${provider}`
  const [discovery, setDiscovery] = useState<{ result: DiscoveryResult; url: string }>()

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error('Model discovery unavailable')
        }
        const result: DiscoveryResult = await response.json()
        if (
          (result?.source !== 'live' && result?.source !== 'fallback') ||
          !Array.isArray(result.models)
        ) {
          throw new Error('Invalid model inventory')
        }
        if (!controller.signal.aborted) {
          setDiscovery({ result, url })
        }
      } catch {
        if (!controller.signal.aborted) {
          setDiscovery({
            result: {
              message: 'Live model discovery unavailable. Showing bundled models.',
              models: [],
              source: 'fallback',
            },
            url,
          })
        }
      }
    })()

    return () => controller.abort()
  }, [url])

  const result = discovery?.url === url ? discovery.result : undefined
  const fallbackModels = fallbackOptions.map((option) =>
    typeof option === 'string'
      ? { id: option, label: option }
      : { id: option.value, label: option.label },
  )
  const models = result?.source === 'live' ? result.models : fallbackModels
  const options = models.map(({ id, label }) => ({ label, value: id }))
  const selectedModel = models.find((model) => model.id === value)

  if (value && !selectedModel) {
    options.unshift({ label: `${value} (current selection)`, value })
  }

  const modelMetadata = result?.models.find((model) => model.id === value)
  const disabledInput = readOnly || disabled

  return (
    <>
      <SelectInput
        description={
          result?.source === 'live'
            ? provider === 'openai'
              ? 'OpenAI lists candidate models but does not report their compatibility or accepted settings.'
              : 'Live models available to your Anthropic account. Not all settings are reported.'
            : result?.message || 'Checking provider availability. Showing bundled models for now.'
        }
        isClearable={false}
        label="Choose a model"
        name={`${fieldPath}-catalog`}
        onChange={(option) => {
          if (!disabledInput && option && !Array.isArray(option) && typeof option.value === 'string') {
            setValue(option.value)
          }
        }}
        options={options}
        path={`${fieldPath}-catalog`}
        readOnly={disabledInput}
        value={value}
      />
      <TextInput
        description="Choose from the list above or enter a model ID directly."
        label={field.label}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          if (!disabledInput) {
            setValue(event.currentTarget.value)
          }
        }}
        path={fieldPath}
        readOnly={disabledInput}
        required={field.required}
        showError={showError}
        value={value ?? ''}
      />
      {modelMetadata?.maxOutputTokens !== undefined && (
        <p>Provider-reported output limit: {modelMetadata.maxOutputTokens} tokens.</p>
      )}
      {modelMetadata?.structuredOutputs === true && (
        <p>The provider reports support for native structured outputs.</p>
      )}
    </>
  )
}
