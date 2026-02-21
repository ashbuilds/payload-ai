'use client'

import { SelectInput, useField, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useMemo } from 'react'

import type { Voice } from '../shared.js'

import { handleSelectChange } from '../shared.js'
import { useAISettings } from '../useAISettings.js'

type Props = {
  name: string
  path: string
}

interface ProviderBlock {
  blockType: string
  enabled?: boolean
  voices?: Voice[]
}

const StatusMessage: React.FC<{ label: string; message: string; path: string }> = ({ label, message, path }) => (
  <div className="field-type text">
    <label className="field-label" htmlFor={path}>
      {label}
    </label>
    <p style={{ color: 'var(--theme-elevation-600)', fontSize: '13px' }}>
      {message}
    </p>
  </div>
)

export const DynamicVoiceSelect: React.FC<Props> = (props) => {
  const { name, path } = props

  // Get provider from siblings
  const parentPath = path.split('.').slice(0, -1).join('.')
  const providerPath = `${parentPath}.provider`

  // Use useFormFields to get the provider field value - this will re-render when provider changes
  const providerField = useFormFields(([fields]) => fields[providerPath])
  const provider = (providerField?.value as string) || ''

  const { setValue, value } = useField<string>({ path })
  const { data: aiSettings, isLoading } = useAISettings()

  const voices = useMemo(() => {
    if (!provider || !aiSettings?.providers) {
      return []
    }

    // Find the provider block matching the selected provider
    const providerBlock = aiSettings.providers.find(
      (p: ProviderBlock) => p.blockType === provider && p.enabled !== false,
    ) as ProviderBlock | undefined

    if (!providerBlock?.voices) {
      return []
    }

    // Get enabled voices from provider block
    return providerBlock.voices
      .filter((v: Voice) => v.enabled !== false)
      .map((v: Voice) => ({
        label: v.name || v.id,
        value: v.id,
      }))
  }, [provider, aiSettings])

  // Clear voice selection when provider changes and current voice is not available
  useEffect(() => {
    if (value && voices.length > 0) {
      const voiceExists = voices.some((v) => v.value === value)
      if (!voiceExists) {
        setValue('')
      }
    }
  }, [voices, value, setValue])

  if (!provider) {
    return <StatusMessage label="Voice" message="Please select a provider first." path={path} />
  }

  if (isLoading) {
    return <StatusMessage label="Voice" message="Loading voices..." path={path} />
  }

  if (voices.length === 0) {
    return (
      <StatusMessage
        label="Voice"
        message={`No voices available. Please configure voices in AI Settings for ${provider}.`}
        path={path}
      />
    )
  }

  return (
    <div className="field-type select">
      <label className="field-label" htmlFor={path}>
        Voice
      </label>
      <SelectInput
        name={name}
        onChange={(option) => handleSelectChange(setValue, option)}
        options={voices}
        path={path}
        value={value}
      />
    </div>
  )
}

