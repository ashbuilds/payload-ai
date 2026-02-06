'use client'

import { toast, useConfig } from '@payloadcms/ui'
// @ts-expect-error - Next.js types are not resolving correctly with nodenext but runtime is fine
import { useRouter } from 'next/navigation'
import React, { useContext, useEffect, useState } from 'react'

import { InstructionsContext } from '../../providers/InstructionsProvider/context.js'
import { excludeCollections } from '../../defaults.js'

export const AIConfigDashboard: React.FC = () => {
  const {
    config: {
      collections,
      routes: { admin: adminRoute, api: apiRoute },
    },
  } = useConfig()
  const router = useRouter()
  const { setEnabledCollections: setEnabledCollectionsInContext } = useContext(InstructionsContext)

  const [enabledCollections, setEnabledCollections] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const availableCollections = collections.filter(
    (c) =>
      !excludeCollections.includes(c.slug) &&
      !((c.admin as unknown as { hidden?: boolean | ((args: any) => boolean) })?.hidden),
  )

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${apiRoute}/globals/ai-settings`)
        if (response.ok) {
          const data = await response.json()
          // Handle both simple array and object wrapper if Payload wraps it
          const storedEnabled = data.enabledCollections || []
          setEnabledCollections(Array.isArray(storedEnabled) ? storedEnabled : [])
        }
      } catch (error) {
        console.error('Failed to fetch AI settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

     fetchSettings().catch((e)=>{console.log(e)})
  }, [apiRoute])

  const handleToggle = (slug: string) => {
    setEnabledCollections((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug)
      }
      return [...prev, slug]
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // First fetch current settings to get ID or just rely on global update behavior
      // We need to adhere to Payload's global update API
      const response = await fetch(`${apiRoute}/globals/ai-settings`, {
        body: JSON.stringify({
          enabledCollections,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Settings saved successfully')
        if (setEnabledCollectionsInContext) {
          setEnabledCollectionsInContext(enabledCollections)
        }
        router.refresh()
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Error saving settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading AI configuration...</div>
  }

  return (
    <div
      style={{
        background: 'var(--theme-elevation-50)',
        // border: '1px solid var(--theme-elevation-150)',
        // borderRadius: '8px',
        marginBottom: '20px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          alignItems: 'center',
          borderBottom: '1px solid var(--theme-elevation-150)',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '20px',
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 5px 0' }}>AI Configuration</h4>
          <p style={{ color: 'var(--theme-elevation-500)', fontSize: '14px', margin: '0' }}>
            Manage your AI providers, API keys, and enable AI for specific collections.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a href={`${adminRoute}/globals/ai-settings`}>
            <button className="btn btn--style-secondary btn--size-small">Settings</button>
          </a>
          <button
            className="btn btn--style-primary btn--size-small"
            disabled={isSaving}
            onClick={handleSave}
            type="button"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <h5 style={{ marginBottom: '15px' }}>Enabled Collections</h5>
        <div
          style={{
            display: 'grid',
            gap: '15px',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          }}
        >
          {availableCollections.map((collection) => {
            const isEnabled = enabledCollections.includes(collection.slug)
            return (
              <button
                key={collection.slug}
                onClick={() => handleToggle(collection.slug)}
                style={{
                  alignItems: 'center',
                  background: isEnabled
                    ? 'var(--theme-elevation-100)'
                    : 'var(--theme-elevation-50)',
                  border: `1px solid ${isEnabled ? 'var(--theme-text-success)' : 'var(--theme-elevation-200)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '10px',
                  padding: '10px 15px',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  width: '100%',
                }}
                type="button"
              >
                <div
                  style={{
                    alignItems: 'center',
                    background: isEnabled
                      ? 'var(--theme-text-success)'
                      : 'var(--theme-elevation-200)',
                    borderRadius: '12px',
                    display: 'flex',
                    height: '24px',
                    justifyContent: isEnabled ? 'flex-end' : 'flex-start',
                    padding: '2px',
                    transition: 'all 0.2s ease',
                    width: '44px',
                  }}
                >
                  <div
                    style={{
                      background: 'white',
                      borderRadius: '50%',
                      height: '20px',
                      width: '20px',
                    }}
                  />
                </div>
                <span style={{ fontWeight: 500 }}>
                  {typeof collection.labels?.singular === 'string'
                    ? collection.labels.singular
                    : (collection.labels?.singular)?.en ||
                      collection.slug}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
