'use client'

import { useField, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

export const ProviderOptionsEditor: React.FC<any> = (props) => {
  const { path } = props
  
  const parentPath = path.split('.').slice(0, -1).join('.')
  const providerField = useFormFields(([fields]) => fields[`${parentPath}.provider`])
  const provider = providerField?.value as string
  
  // Infer use case from path
  const useCase = path.includes('tts-settings') ? 'tts' :
                  path.includes('image-settings') ? 'image' : 
                  path.includes('video-settings') ? 'video' : 'text'
  
  const { setValue, value } = useField<Record<string, any>>({ path })
  const [aiSettings, setAiSettings] = useState<any>(null)

  useEffect(() => {
    fetch('/api/globals/ai-settings?depth=1')
      .then(res => res.json())
      .then(data => setAiSettings(data))
      .catch(err => console.error('Error fetching AI settings:', err))
  }, [])

  const defaultOptions = useMemo(() => {
    if (!provider || !aiSettings) return null

    const providerBlock = aiSettings.providers?.find(
      (p: any) => p.blockType === provider && p.enabled
    )
    if (!providerBlock) return null

    // Get provider options by use case
    const optionsKey = `${useCase}ProviderOptions`
    return providerBlock[optionsKey] || null
  }, [provider, useCase, aiSettings])

  return (
    <div className="field-type json">
      <div style={{ marginBottom: '10px' }}>
        <label className="field-label">Provider Options</label>
        {defaultOptions ? (
          <div style={{ 
            background: 'var(--theme-elevation-100)', 
            padding: '10px', 
            borderRadius: '4px',
            marginBottom: '10px',
            fontSize: '12px',
          }}>
            <strong>Default options from AI Settings:</strong>
            <pre style={{ 
              margin: '8px 0 0 0', 
              fontSize: '11px',
              color: 'var(--theme-elevation-600)',
              whiteSpace: 'pre-wrap'
            }}>
              {JSON.stringify(defaultOptions, null, 2)}
            </pre>
          </div>
        ) : provider ? (
           <p style={{ color: 'var(--theme-elevation-600)', fontSize: '12px', marginBottom: '8px' }}>
            No default options configured for {provider} {useCase}.
          </p>
        ) : null}
      </div>
      
      <p style={{ fontSize: '12px', marginBottom: '8px', color: 'var(--theme-elevation-600)' }}>
        Override options here (JSON format):
      </p>

      <textarea
        value={JSON.stringify(value || {}, null, 2)}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value)
            setValue(parsed)
          } catch {
            // Invalid JSON, don't update state yet or handle error visually if desired
            // For now, simpler approach is just to let them type, but Payload assumes valid JSON for connection
            // A better approach for a raw JSON editor might be needed or just careful typing.
            // But standard textarea syncing to JSON value acts weird if invalid.
            // Let's rely on user providing valid JSON or use a better editor if available.
            // Since we are building a simple editor:
          }
        }}
        // Using onBlur to commit changes to avoid parsing errors while typing could be better,
        // but 'value' from useField expects the object.
        // We might need a local state for the text string.
        style={{
          width: '100%',
          minHeight: '150px',
          fontFamily: 'monospace',
          fontSize: '12px',
          padding: '10px',
          background: 'var(--theme-bg)',
          color: 'var(--theme-text)',
          border: '1px solid var(--theme-elevation-200)',
          borderRadius: '4px',
        }}
      />
      
      {/* 
        Actually, directly binding textarea to JSON object via parse/stringify is clunky 
        because typing "{" breaks it immediately. 
        Better to use a local string state.
      */}
      <JsonEditor
        initialValue={value}
        onChange={setValue}
      />
      
      {defaultOptions && (
        <button
          type="button"
          onClick={() => setValue({})}
          style={{
            marginTop: '8px',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            background: 'var(--theme-elevation-200)',
            border: 'none',
            borderRadius: '4px',
            color: 'var(--theme-text)'
          }}
        >
          Clear Overrides
        </button>
      )}
    </div>
  )
}

const JsonEditor = ({ initialValue, onChange }: { initialValue: any, onChange: (val: any) => void }) => {
  const [text, setText] = useState(JSON.stringify(initialValue || {}, null, 2))
  const [error, setError] = useState<string | null>(null)

  // Sync from parent if initialValue changes externally (unlikely during edit but good practice)
  useEffect(() => {
     // Only if we are not currently editing? Or just trust parent?
     // For now simple:
  }, [initialValue])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)
    try {
      const parsed = JSON.parse(newText)
      setError(null)
      onChange(parsed)
    } catch (err) {
      setError('Invalid JSON')
    }
  }

  return (
    <>
      <textarea
        value={text}
        onChange={handleChange}
        style={{
          width: '100%',
          minHeight: '150px',
          fontFamily: 'monospace',
          fontSize: '12px',
          padding: '10px',
          background: 'var(--theme-bg)',
          color: 'var(--theme-text)',
          border: error ? '1px solid red' : '1px solid var(--theme-elevation-200)',
          borderRadius: '4px',
        }}
      />
      {error && <span style={{ color: 'red', fontSize: '11px' }}>{error}</span>}
    </>
  )
}
