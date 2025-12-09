'use client'

import { RenderFields, useField, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

import { allProviderBlocks } from '../../ai/providers/blocks/index.js'

type UseCase = 'text' | 'image' | 'tts' | 'video'

interface ProviderOptionsEditorProps {
  path: string
  name?: string
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
          if (found) return found
        }
      }
      if (field.type === 'group' && 'fields' in field) {
        const found = searchFields(field.fields)
        if (found) return found
      }
    }
    return undefined
  }
  
  return searchFields(block.fields)
}

/**
 * Get provider options fields for a given provider and use case
 */
function getProviderOptionsFields(providerSlug: string, useCase: UseCase): any[] {
  const block = allProviderBlocks.find((b) => b.slug === providerSlug)
  if (!block) return []

  const groupName = `${useCase}ProviderOptions`
  const optionsGroup = findFieldInBlock(block, groupName)

  if (optionsGroup && optionsGroup.type === 'group' && 'fields' in optionsGroup) {
    return optionsGroup.fields
  }

  return []
}

export const ProviderOptionsEditor: React.FC<ProviderOptionsEditorProps> = (props) => {
  const { path } = props
  
  // Get parent path to find sibling provider field
  const parentPath = path.split('.').slice(0, -1).join('.')
  const providerField = useFormFields(([fields]) => fields[`${parentPath}.provider`])
  const provider = providerField?.value as string
  
  // Infer use case from path
  const useCase: UseCase = path.includes('tts-settings') ? 'tts' :
                  path.includes('image-settings') ? 'image' : 
                  path.includes('video-settings') ? 'video' : 'text'
  
  const { setValue, value } = useField<Record<string, any>>({ path })
  const [aiSettings, setAiSettings] = useState<any>(null)

  // Fetch AI Settings to get current provider defaults
  useEffect(() => {
    fetch('/api/globals/ai-settings?depth=1')
      .then(res => res.json())
      .then(data => setAiSettings(data))
      .catch(err => console.error('Error fetching AI settings:', err))
  }, [])

  // Get the configured default options from AI Settings for this provider
  const configuredDefaults = useMemo(() => {
    if (!provider || !aiSettings) return null

    const providerBlock = aiSettings.providers?.find(
      (p: any) => p.blockType === provider && p.enabled
    )
    if (!providerBlock) return null

    // Get provider options by use case
    const optionsKey = `${useCase}ProviderOptions`
    return providerBlock[optionsKey] || null
  }, [provider, useCase, aiSettings])

  // Get field definitions from provider block
  const fields = useMemo(() => {
    if (!provider) return []
    return getProviderOptionsFields(provider, useCase)
  }, [provider, useCase])

  // Check if there are any overrides set
  const hasOverrides = useMemo(() => {
    return value && Object.keys(value).length > 0
  }, [value])

  if (!provider) {
    return (
      <div className="field-type" style={{ padding: '12px 0' }}>
        <p style={{ color: 'var(--theme-elevation-600)', fontSize: '13px', margin: 0 }}>
          Please select a provider first to configure options.
        </p>
      </div>
    )
  }

  if (fields.length === 0) {
    return (
      <div className="field-type" style={{ padding: '12px 0' }}>
        <p style={{ color: 'var(--theme-elevation-600)', fontSize: '13px', margin: 0 }}>
          No configurable options available for {provider} ({useCase}).
        </p>
      </div>
    )
  }

  return (
    <div className="field-type provider-options-editor">
      <div style={{ marginBottom: '16px' }}>
        <label className="field-label" style={{ display: 'block', marginBottom: '8px' }}>
          Provider Options
        </label>
        
        {configuredDefaults && (
          <div style={{ 
            background: 'var(--theme-elevation-50)', 
            padding: '12px', 
            borderRadius: '4px',
            marginBottom: '12px',
            fontSize: '12px',
            border: '1px solid var(--theme-elevation-100)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <strong style={{ color: 'var(--theme-elevation-800)' }}>
                Defaults from AI Settings
              </strong>
              <span style={{ 
                fontSize: '11px',
                color: 'var(--theme-elevation-500)',
                background: 'var(--theme-elevation-100)',
                padding: '2px 8px',
                borderRadius: '10px'
              }}>
                Inherited
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px',
              color: 'var(--theme-elevation-600)'
            }}>
              {Object.entries(configuredDefaults).map(([key, val]) => {
                // Skip nested objects for display
                if (typeof val === 'object' && val !== null) {
                  return null
                }
                return (
                  <span key={key} style={{ 
                    background: 'var(--theme-elevation-100)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px'
                  }}>
                    {key}: <strong>{String(val)}</strong>
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <p style={{ 
          fontSize: '12px', 
          color: 'var(--theme-elevation-500)', 
          marginBottom: '12px',
          fontStyle: 'italic'
        }}>
          Override defaults for this specific field. Empty values inherit from AI Settings.
        </p>
      </div>

      <RenderFields
        fields={fields as any}
        forceRender
        margins="small"
        parentIndexPath=""
        parentPath={path}
        parentSchemaPath={path}
        permissions={true as any}
      />

      {hasOverrides && (
        <button
          type="button"
          onClick={() => setValue({})}
          style={{
            marginTop: '12px',
            padding: '8px 16px',
            fontSize: '13px',
            cursor: 'pointer',
            background: 'transparent',
            border: '1px solid var(--theme-elevation-200)',
            borderRadius: '4px',
            color: 'var(--theme-text)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--theme-elevation-100)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          Reset to Defaults
        </button>
      )}
    </div>
  )
}
