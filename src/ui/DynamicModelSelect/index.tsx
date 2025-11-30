'use client'

import { SelectInput, useField, useFormFields } from '@payloadcms/ui'
import React, { useMemo } from 'react'

import { allProviderBlocks } from '../../ai/providers/blocks/index.js'

type Props = {
  name: string
  path: string
  useCase: string // Passed via field admin.components.Field props if possible, or we deduce it
}

export const DynamicModelSelect: React.FC<Props> = (props) => {
  const { name, path } = props
  
  // The useCase might need to be passed differently or hardcoded if we can't pass props easily to custom field components in this context.
  // However, usually we can pass custom props in the config. 
  // For now, let's assume we can infer it or it's passed. 
  // Actually, Payload custom components receive the field config. 
  // Let's check if we can access the field config to get a custom property.
  // But for simplicity, we might need separate components or check the path?
  // Let's assume 'useCase' is passed in the `admin` config or we check the field definition.
  
  // Getting the 'provider' sibling field value
  // The path is like 'defaults.image.model'. We want 'defaults.image.provider'.
  const parentPath = path.split('.').slice(0, -1).join('.')
  const providerPath = `${parentPath}.provider`
  
  const providerField = useFormFields(([fields]) => fields[providerPath])
  const providerValue = providerField?.value as string

  const providersField = useFormFields(([fields]) => fields['providers'])
  const providersData = providersField?.value as any[] || []

  const { setValue, value } = useField<string>({ path })
  console.log("providersData : ", providersData)
  const options = useMemo(() => {
    if (!providerValue) {return []}

    const optionsList: { label: string; value: string }[] = []
    
    // 1. Get static default models from the block definition
    const staticBlock = allProviderBlocks.find(b => b.slug === providerValue)
    if (staticBlock) {
      const modelsField = staticBlock.fields.find((f: any) => f.name === 'models')
      const defaultModels = modelsField && 'defaultValue' in modelsField ? (modelsField.defaultValue as any[]) : []
      
      // We need to know the useCase. 
      // In the config, we can pass it as a custom prop in 'admin'.
      // But here, let's try to guess it from the path (e.g. 'defaults.image.model' -> 'image')
      const pathParts = path.split('.')
      const inferredUseCase = pathParts[pathParts.length - 2] // 'image' from 'defaults.image.model'
      console.log("defaultModels:V ", defaultModels)
      defaultModels.forEach((m) => {
        if (m.useCase === inferredUseCase) {
          optionsList.push({
            label: m.name,
            value: m.id,
          })
        }
      })
    }

    // 2. Get dynamic models from the form data (user configuration)
    const userProviderBlock = providersData.find((p: any) => p.blockType === providerValue)
     console.log("userProviderBlock : ", userProviderBlock)
    if (userProviderBlock && userProviderBlock.models) {
      const pathParts = path.split('.')
      const inferredUseCase = pathParts[pathParts.length - 2]

      userProviderBlock.models.forEach((m: any) => {
        if (m.useCase === inferredUseCase) {
          // Avoid duplicates if the user re-added a default model (by ID)
          if (!optionsList.some(opt => opt.value === m.id)) {
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
      <label className="field-label" htmlFor={path}>Model</label>
      <SelectInput
        name={name}
        onChange={(option) => {
          if (option && typeof option === 'object' && 'value' in option) {
            setValue(option.value as string)
          } else {
            setValue(option as string)
          }
        }}
        options={options}
        path={path}
        value={value}
      />
    </div>
  )
}
