'use client'

import { useConfig } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

import { PLUGIN_NAME, PLUGIN_SETTINGS_GLOBAL } from '../../defaults.js'

type ModelOption = { label: string; output?: string; value: string }

type Features = {
  enableImage?: boolean
  enableText?: boolean
  enableVoice?: boolean
}

type SettingsDoc = {
  defaultModelId?: string
  defaultSystemPrompt?: string
  enabledLanguages?: Array<{ code?: string } | string>
  features?: Features
  id?: number | string
  temperature?: number
}

const Section: React.FC<{ children: React.ReactNode; description?: string; title: string }> = ({
  children,
  description,
  title,
}) => {
  return (
    <div style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: 8, padding: 16 }}>
      <div style={{ marginBottom: 10 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {description ? (
          <p style={{ color: 'var(--theme-elevation-500)', margin: '6px 0 0' }}>{description}</p>
        ) : null}
      </div>
      <div>{children}</div>
    </div>
  )
}

export const InstructionsSettingsPanel: React.FC = () => {
  const { config } = useConfig()
  const {
    admin,
    routes: { api },
    serverURL,
  } = config

  const injectedModels = (admin?.custom?.[PLUGIN_NAME]?.models ?? []) as ModelOption[]
  const models = useMemo<ModelOption[]>(
    () => injectedModels.filter((m) => !m.output || m.output === 'text' || m.output === 'json'),
    [injectedModels],
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const [savedAt, setSavedAt] = useState<null | number>(null)

  const [docId, setDocId] = useState<number | string | undefined>(undefined)
  const [defaultModelId, setDefaultModelId] = useState<string>('')
  const [defaultSystemPrompt, setDefaultSystemPrompt] = useState<string>('')
  const [temperature, setTemperature] = useState<number>(1)
  const [features, setFeatures] = useState<Features>({
    enableImage: true,
    enableText: true,
    enableVoice: true,
  })
  const [enabledLanguagesCsv, setEnabledLanguagesCsv] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${serverURL}${api}/globals/${PLUGIN_SETTINGS_GLOBAL}`)
        if (!res.ok) {
          // When global not created yet, Payload returns 404; treat as empty default
          if (res.status !== 404) {
            throw new Error(`Failed to load settings (${res.status})`)
          }
        } else {
          const json: SettingsDoc = await res.json()
          if (!cancelled && json) {
            setDocId(json.id)
            if (json.defaultModelId) {setDefaultModelId(json.defaultModelId)}
            if (typeof json.defaultSystemPrompt === 'string')
              {setDefaultSystemPrompt(json.defaultSystemPrompt)}
            if (typeof json.temperature === 'number') {setTemperature(json.temperature)}
            if (json.features) {
              setFeatures({
                enableImage: json.features.enableImage ?? true,
                enableText: json.features.enableText ?? true,
                enableVoice: json.features.enableVoice ?? true,
              })
            }
            const langs =
              json.enabledLanguages?.map((l) => (typeof l === 'string' ? l : l?.code || '')) || []
            setEnabledLanguagesCsv(langs.filter(Boolean).join(', '))
          }
        }
      } catch (e: any) {
        if (!cancelled) {setError(e?.message ?? 'Failed to load settings')}
      } finally {
        if (!cancelled) {setLoading(false)}
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [api, serverURL])

  const onSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const body: SettingsDoc = {
        defaultModelId: defaultModelId || undefined,
        defaultSystemPrompt: defaultSystemPrompt || undefined,
        enabledLanguages: (enabledLanguagesCsv || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((code) => ({ code })),
        features: {
          enableImage: !!features.enableImage,
          enableText: !!features.enableText,
          enableVoice: !!features.enableVoice,
        },
        temperature:
          typeof temperature === 'number' && !Number.isNaN(temperature) ? temperature : 1,
      }

      const method = docId ? 'PUT' : 'POST'
      const res = await fetch(`${serverURL}${api}/globals/${PLUGIN_SETTINGS_GLOBAL}`, {
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
        method,
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(`Failed to save settings (${res.status}) ${txt}`)
      }

      const saved = (await res.json()) as SettingsDoc
      setDocId(saved.id)
      setSavedAt(Date.now())
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontWeight: 600, marginBottom: 6 }
  const controlStyle: React.CSSProperties = { width: '100%' }
  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: '1fr 1fr',
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: 12,
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>AI / Plugin Settings</h2>
          <p style={{ color: 'var(--theme-elevation-500)', margin: '6px 0 0' }}>
            Configure global AI behavior. These settings apply across collections.
          </p>
        </div>
        <div>
          <button
            className="btn btn--primary"
            disabled={saving || loading}
            onClick={onSave}
            type="button"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {error ? (
        <div
          style={{
            background: 'var(--theme-error-50)',
            border: '1px solid var(--theme-error-500)',
            borderRadius: 6,
            color: 'var(--theme-error-500)',
            marginBottom: 12,
            padding: 12,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
        <Section description="Default model used for text / JSON generation." title="Model">
          <div style={rowStyle}>
            <div>
              <label htmlFor="defaultModelId" style={labelStyle}>
                Default Model
              </label>
              <select
                id="defaultModelId"
                onChange={(e) => setDefaultModelId(e.target.value)}
                style={controlStyle}
                value={defaultModelId}
              >
                <option value="">— Select model —</option>
                {models.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="temperature" style={labelStyle}>
                Temperature
              </label>
              <input
                id="temperature"
                max={2}
                min={0}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                step={0.1}
                style={controlStyle}
                type="number"
                value={Number.isNaN(temperature) ? '' : temperature}
              />
            </div>
          </div>
        </Section>

        <div style={{ height: 12 }} />

        <Section description="Toggle which AI features are available." title="Features">
          <div style={{ display: 'flex', gap: 24 }}>
            <label style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
              <input
                checked={!!features.enableText}
                onChange={(e) => setFeatures((f) => ({ ...f, enableText: e.target.checked }))}
                type="checkbox"
              />
              Enable Text
            </label>
            <label style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
              <input
                checked={!!features.enableImage}
                onChange={(e) => setFeatures((f) => ({ ...f, enableImage: e.target.checked }))}
                type="checkbox"
              />
              Enable Image
            </label>
            <label style={{ alignItems: 'center', display: 'inline-flex', gap: 8 }}>
              <input
                checked={!!features.enableVoice}
                onChange={(e) => setFeatures((f) => ({ ...f, enableVoice: e.target.checked }))}
                type="checkbox"
              />
              Enable Voice
            </label>
          </div>
        </Section>

        <div style={{ height: 12 }} />

        <Section
          description="Optional global system instructions applied by default when composing content."
          title="System Prompt"
        >
          <textarea
            onChange={(e) => setDefaultSystemPrompt(e.target.value)}
            rows={4}
            style={{ ...controlStyle, fontFamily: 'monospace' }}
            value={defaultSystemPrompt}
          />
        </Section>

        <div style={{ height: 12 }} />

        <Section
          description="Comma-separated locale tags used in Translate menu (e.g. en, en-US, zh-CN)."
          title="Enabled Languages"
        >
          <input
            onChange={(e) => setEnabledLanguagesCsv(e.target.value)}
            placeholder="en, en-US, zh-CN"
            style={controlStyle}
            type="text"
            value={enabledLanguagesCsv}
          />
        </Section>

        {savedAt ? (
          <>
            <div style={{ height: 8 }} />
            <div
              style={{
                color: 'var(--theme-success-500)',
                fontSize: 12,
              }}
            >
              Saved at {new Date(savedAt).toLocaleTimeString()}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export default InstructionsSettingsPanel
