'use client'

import { SelectInput, useField, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

type Props = {
  name: string
  path: string
}

interface Voice {
  category?: string
  enabled?: boolean
  id: string
  labels?: Record<string, unknown>
  name: string
  preview_url?: string
}

interface ProviderBlock {
  blockType: string
  enabled?: boolean
  voices?: Voice[]
}

export const DynamicVoiceSelect: React.FC<Props> = (props) => {
  const { name, path } = props

  // Get provider from siblings
  const parentPath = path.split('.').slice(0, -1).join('.')
  const providerPath = `${parentPath}.provider`

  // Use useFormFields to get the provider field value - this will re-render when provider changes
  const providerField = useFormFields(([fields]) => fields[providerPath])
  const provider = (providerField?.value as string) || ''

  const { setValue, value } = useField<string>({ path })
  const [aiSettings, setAiSettings] = useState<{ providers?: ProviderBlock[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch AI Settings - re-fetch when provider changes to ensure we have latest voices
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/globals/ai-providers?depth=1')
        if (response.ok) {
          const data = await response.json()
          setAiSettings(data)
        }
      } catch (err) {
        console.error('Error fetching AI settings:', err)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchSettings()
  }, [provider]) // Re-fetch when provider changes to ensure we have the latest voices

  const voices = useMemo(() => {
    if (!provider || !aiSettings?.providers) {
      return []
    }

    // Find the provider block matching the selected provider
    const providerBlock = aiSettings.providers.find(
      (p: ProviderBlock) => p.blockType === provider && p.enabled !== false,
    )

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
    return (
      <div className="field-type text">
        <label className="field-label" htmlFor={path}>
          Voice
        </label>
        <p style={{ color: 'var(--theme-elevation-600)', fontSize: '13px' }}>
          Please select a provider first.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="field-type text">
        <label className="field-label" htmlFor={path}>
          Voice
        </label>
        <p style={{ color: 'var(--theme-elevation-600)', fontSize: '13px' }}>Loading voices...</p>
      </div>
    )
  }

  if (voices.length === 0) {
    return (
      <div className="field-type text">
        <label className="field-label" htmlFor={path}>
          Voice
        </label>
        <p style={{ color: 'var(--theme-elevation-600)', fontSize: '13px' }}>
          No voices available. Please configure voices in AI Settings for {provider}.
        </p>
      </div>
    )
  }

  return (
    <div className="field-type select">
      <label className="field-label" htmlFor={path}>
        Voice
      </label>
      <SelectInput
        name={name}
        onChange={(option) => {
          if (option && typeof option === 'object' && 'value' in option) {
            setValue(option.value as string)
          } else {
            setValue(option)
          }
        }}
        options={voices}
        path={path}
        value={value}
      />
    </div>
  )
}

