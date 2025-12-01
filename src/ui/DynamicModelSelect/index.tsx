'use client'

import { SelectInput, useField, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

import { allProviderBlocks } from '../../ai/providers/blocks/index.js'

type Props = {
  name: string
  path: string
}

export const DynamicModelSelect: React.FC<Props> = (props) => {
  const { name, path } = props

  // Getting the 'provider' sibling field value
  const parentPath = path.split('.').slice(0, -1).join('.')
  const providerPath = `${parentPath}.provider`

  const providerField = useFormFields(([fields]) => fields[providerPath])
  const providerValue = providerField?.value as string

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

    fetchSettings().catch(console.error)
  }, [])

  const options = useMemo(() => {
    if (!providerValue) {
      return []
    }

    const optionsList: { label: string; value: string }[] = []

    // 1. Get static default models from the block definition
    const staticBlock = allProviderBlocks.find((b) => b.slug === providerValue)

    // Determine useCase.
    // Since this component is primarily used in ImageConfig (image-settings), we default to 'image'.
    // Ideally this should be passed as a prop, but for now we infer or default.
    const pathParts = path.split('.')
    // If path is 'image-settings.model', inferred is 'image-settings'.
    // We check if inferred is 'image', 'text', etc. If not, default to 'image' for now as this is mostly for image generation.
    let inferredUseCase = pathParts[pathParts.length - 2]
    if (inferredUseCase === 'image-settings') {
      inferredUseCase = 'image'
    }

    if (staticBlock) {
      const modelsField = staticBlock.fields.find((f: any) => f.name === 'models')
      const defaultModels =
        modelsField && 'defaultValue' in modelsField ? (modelsField.defaultValue as any[]) : []

      defaultModels.forEach((m) => {
        if (m.useCase === inferredUseCase) {
          optionsList.push({
            label: m.name,
            value: m.id,
          })
        }
      })
    }

    // 2. Get dynamic models from the fetched providers data
    // The fetched data is structured (not flat), so we can iterate directly.
    const userProviderBlock = providersData.find((p: any) => p.blockType === providerValue)

    if (userProviderBlock && userProviderBlock.models) {
      userProviderBlock.models.forEach((m: any) => {
        if (m.useCase === inferredUseCase) {
          // Avoid duplicates
          if (!optionsList.some((opt) => opt.value === m.id)) {
            optionsList.push({
              label: m.name,
              value: m.id,
            })
          }
        }
      })
    }

    return optionsList
  }, [providerValue, providersData, path])

  return (
    <div className="field-type select">
      <label className="field-label" htmlFor={path}>
        Model
      </label>
      <SelectInput
        name={name}
        onChange={(option) => {
          console.log("SelectInput - > ",option)
          if (option && typeof option === 'object' && 'value' in option) {
            setValue(option.value as string)
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
