'use client'

import { SelectInput, useField, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

import { allProviderBlocks } from '../../ai/providers/blocks/index.js'

type Props = {
  name: string
  path: string
}

/**
 * Find a field by name within a block's fields, searching through tabs
 */
function findFieldInBlock(block: any, fieldName: string): any | undefined {
  const searchFields = (fields: any[]): any | undefined => {
    for (const field of fields) {
      if ('name' in field && field.name === fieldName) {
        return field
      }
      if (field.type === 'tabs' && 'tabs' in field) {
        for (const tab of field.tabs) {
          const found = searchFields(tab.fields)
          if (found) {
            return found
          }
        }
      }
      if (field.type === 'group' && 'fields' in field) {
        const found = searchFields(field.fields)
        if (found) {
          return found
        }
      }
    }
    return undefined
  }
  
  return searchFields(block.fields)
}

/**
 * Infer use case from field path
 * Handles both:
 * - AISettings paths: 'defaults.text.model', 'defaults.image.model'
 * - Instructions paths: 'text-settings.model', 'image-settings.model'
 */
function inferUseCase(path: string): string {
  const pathParts = path.split('.')
  const parentName = pathParts[pathParts.length - 2]
  
  // AISettings: 'defaults.text.model' -> parentName is 'text'
  // Direct use case names
  if (['image', 'text', 'tts', 'video'].includes(parentName)) {
    return parentName
  }
  
  // Instructions: 'text-settings.model' -> parentName is 'text-settings'
  if (parentName === 'image-settings') {
    return 'image'
  }
  if (parentName === 'tts-settings') {
    return 'tts'
  }
  if (parentName === 'text-settings' || parentName === 'richtext-settings') {
    return 'text'
  }
  if (parentName === 'video-settings') {
    return 'video'
  }
  
  // Default to text
  return 'text'
}

export const DynamicModelSelect: React.FC<Props> = (props) => {
  const { name, path } = props

  // Getting the 'provider' sibling field value
  const parentPath = path.split('.').slice(0, -1).join('.')
  const providerPath = `${parentPath}.provider`

  const providerField = useFormFields(([fields]) => fields[providerPath])
  const providerValue = providerField?.value as string

  // Get all form fields to search for live provider configuration (for AISettings context)
  // We filter to only 'providers' fields to avoid unnecessary re-renders, 
  // but note that the selector runs on every change.
  const formProviders = useFormFields(([fields]) => {
    const providers: Record<string, any> = {}
    if (fields && typeof fields === 'object') {
      Object.keys(fields).forEach((key) => {
        if (key.startsWith('providers.')) {
          providers[key] = fields[key]
        }
      })
    }
    return providers
  })

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

  const inferredUseCase = useMemo(() => inferUseCase(path), [path])

  const options = useMemo(() => {
    if (!providerValue) {
      return []
    }

    const optionsList: { label: string; value: string }[] = []

    // Strategy:
    // 1. Try to find provider in LIVE form state (if editing AISettings)
    // 2. If not found, try to find in FETCHED API data (if editing Instructions or saved AISettings)
    // 3. Fall back to static defaults from block definitions

    let foundInForm = false
    let foundInAPI = false

    // --- 1. Live Form Search ---
    // Iterate through form fields to find the matching provider block
    // We assume standard block structure: providers.0.blockType, etc.
    // We search up to 20 providers to be safe (unlikely to have more)
    for (let i = 0; i < 20; i++) {
      const typeKey = `providers.${i}.blockType`
      const typeField = formProviders[typeKey]
      
      if (!typeField) break // Stop if no more blocks (or gap)
      
      if (typeof typeField === 'object' && 'value' in typeField && typeField.value === providerValue) {
        foundInForm = true
        // Found the provider! Now iterate its models
        // Models path: providers.0.models.0.id
        for (let j = 0; j < 50; j++) {
          const idKey = `providers.${i}.models.${j}.id`
          const nameKey = `providers.${i}.models.${j}.name`
          const useCaseKey = `providers.${i}.models.${j}.useCase`
          const enabledKey = `providers.${i}.models.${j}.enabled`
          
          const idField = formProviders[idKey]
          if (!idField) break // Stop if no more models
          
          const modelId = (idField as any).value as string
          const modelName = (formProviders[nameKey] as any)?.value as string
          const modelUseCase = (formProviders[useCaseKey] as any)?.value as string
          const modelEnabled = (formProviders[enabledKey] as any)?.value
          
          // Check use case and enabled status (default to enabled if undefined)
          if (modelUseCase === inferredUseCase && modelEnabled !== false) {
             optionsList.push({
               label: modelName || modelId,
               value: modelId,
             })
          }
        }
        break // Stop searching providers
      }
    }

    // --- 2. API Data Search (if not found in form) ---
    if (!foundInForm) {
      const userProviderBlock = providersData.find((p: any) => p.blockType === providerValue)

      if (userProviderBlock && userProviderBlock.models) {
        foundInAPI = true
        userProviderBlock.models.forEach((m: any) => {
          if (m.useCase === inferredUseCase && m.enabled !== false) {
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
    }

    // --- 3. Static Defaults (if not found in form OR API) ---
    // Note: We only fall back to static if we didn't find ANY configuration for this provider.
    // If we found the provider but it had no models for this use case, we show empty list (correct).
    if (!foundInForm && !foundInAPI) {
      const staticBlock = allProviderBlocks.find((b) => b.slug === providerValue)

      if (staticBlock) {
        // Search through tabs to find models field
        const modelsField = findFieldInBlock(staticBlock, 'models')
        const defaultModels =
          modelsField && 'defaultValue' in modelsField ? (modelsField.defaultValue as any[]) : []

        defaultModels.forEach((m) => {
          if (m.useCase === inferredUseCase && m.enabled !== false) {
             optionsList.push({
               label: m.name,
               value: m.id,
             })
          }
        })
      }
    }

    return optionsList
  }, [providerValue, providersData, inferredUseCase, formProviders])

  return (
    <div className="field-type select">
      <label className="field-label" htmlFor={path}>
        Model
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
        options={options as any}
        path={path}
        value={value}
      />
    </div>
  )
}

