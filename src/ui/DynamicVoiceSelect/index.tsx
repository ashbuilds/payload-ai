'use client'

import { SelectInput, useField, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

type Props = {
  name: string
  path: string
}

export const DynamicVoiceSelect: React.FC<Props> = (props) => {
  const { name, path } = props

  // Get provider from siblings
  const parentPath = path.split('.').slice(0, -1).join('.')
  // Accessing provider from sibling data in a group
  const providerField = useFormFields(([fields]) => fields[`${parentPath}.provider`])
  const provider = providerField?.value as string

  const { setValue, value } = useField<string>({ path })
  const [aiSettings, setAiSettings] = useState<any>(null)

  useEffect(() => {
    fetch('/api/globals/ai-settings?depth=1')
      .then((res) => res.json())
      .then((data) => setAiSettings(data))
      .catch((err) => console.error('Error fetching AI settings:', err))
  }, [])

  const voices = useMemo(() => {
    if (!provider || !aiSettings) {
      return []
    }

    const providerBlock = aiSettings.providers?.find(
      (p: any) => p.blockType === provider && p.enabled,
    )
    if (!providerBlock) {
      return []
    }

    // Get voices from provider block
    const voicesArray = providerBlock.voices || []

    return voicesArray
      .filter((v: any) => v.enabled !== false)
      .map((v: any) => ({
        label: v.name || v.id,
        value: v.id,
      }))
  }, [provider, aiSettings])

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
