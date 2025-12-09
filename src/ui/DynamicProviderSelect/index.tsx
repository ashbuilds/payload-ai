'use client'

import { SelectInput, useField } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

import { allProviderBlocks } from '../../ai/providers/blocks/index.js'

type Props = {
  name: string
  path: string
}

export const DynamicProviderSelect: React.FC<Props> = (props) => {
  const { name, path } = props

  const { setValue, value } = useField<string>({ path })

  // State to hold fetched providers data
  const [providersData, setProvidersData] = useState<any[]>([])

  // Fetch AI Settings global to get configured providers
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/globals/ai-settings?depth=1')
        if (response.ok) {
          const data = await response.json()
          if (data && data.providers) {
            setProvidersData(data.providers)
          }
        }
      } catch (error) {
        console.error('Error fetching AI settings:', error)
      }
    }

    void fetchSettings()
  }, [])

  const options = useMemo(() => {
    const optionsList: { label: string; value: string }[] = []
    const processedProviders = new Set<string>()

    // Iterate through fetched providers to find custom names
    providersData.forEach((provider: any) => {
      if (!provider.enabled) {
        return
      }

      const blockType = provider.blockType
      const customName = provider.providerName

      // Get static label as fallback
      const staticBlock = allProviderBlocks.find((b) => b.slug === blockType)
      const staticLabel = staticBlock?.labels?.singular
        ? typeof staticBlock.labels.singular === 'string'
          ? staticBlock.labels.singular
          : blockType
        : blockType

      const label = customName || staticLabel

      if (!processedProviders.has(blockType)) {
        optionsList.push({
          label,
          value: blockType,
        })
        processedProviders.add(blockType)
      } else if (customName) {
        // Update existing label if custom name is available
        const existingOpt = optionsList.find((o) => o.value === blockType)
        if (existingOpt && existingOpt.label === staticLabel) {
          existingOpt.label = customName
        }
      }
    })

    // Add any other available providers from blocks that might not be configured yet?
    // Usually we only want to show configured providers in the selection list.
    // But for standard providers (OpenAI, Google), they might not need much config other than API key.
    // If they are not in the list, user can't select them.
    // However, if they are not enabled in settings, maybe we shouldn't show them?
    // Let's stick to showing all available blocks, but prioritizing configured ones with custom names.

    allProviderBlocks.forEach((block) => {
      if (!processedProviders.has(block.slug)) {
        optionsList.push({
          label: typeof block.labels?.singular === 'string' ? block.labels.singular : block.slug,
          value: block.slug,
        })
      }
    })

    return optionsList
  }, [providersData])

  return (
    <div className="field-type select">
      <label className="field-label" htmlFor={path}>
        Provider
      </label>
      <SelectInput
        name={name}
        onChange={(option) => {
          if (option && typeof option === 'object' && 'value' in option) {
            setValue(option.value)
          } else {
            setValue(option)
          }
        }}
        options={options as any}
        path={path}
        value={value}
      />
    </div>
  )
}
