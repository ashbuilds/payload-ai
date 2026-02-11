'use client'

import { Button, toast, useConfig } from '@payloadcms/ui'
// @ts-expect-error - Next.js types are not resolving correctly with nodenext but runtime is fine
import { useRouter } from 'next/navigation'
import React, { use, useEffect, useState } from 'react'

import { excludeCollections } from '../../defaults.js'
import { InstructionsContext } from '../../providers/InstructionsProvider/context.js'

export const ConfigDashboard: React.FC = () => {
  const {
    config: {
      collections,
      routes: { admin: adminRoute, api: apiRoute },
    },
  } = useConfig()
  const router = useRouter()
  const { refresh, setEnabledCollections: setEnabledCollectionsInContext } =
    use(InstructionsContext)

  const [enabledCollections, setEnabledCollections] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const availableCollections = collections.filter(
    (c) =>
      !excludeCollections.includes(c.slug) &&
      !(c.admin as unknown as { hidden?: ((args: any) => boolean) | boolean })?.hidden,
  )

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${apiRoute}/globals/ai-providers`)
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

    fetchSettings().catch((e) => {
      console.log(e)
    })
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
      const response = await fetch(`${apiRoute}/globals/ai-providers`, {
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
        if (refresh) {
          await refresh()
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
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading configuration...</div>
  }

  return (
    <div
      style={{
        background: 'var(--theme-elevation-50)',
        // border: '1px solid var(--theme-elevation-150)',
        // borderRadius: '8px',
        // borderBottom: '1px solid var(--theme-elevation-150)',
        // borderTop: '1px solid var(--theme-elevation-150)',
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
          padding: '8px var(--gutter-h)',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 5px 0' }}>Let's configure your AI Plugin</h2>
          <p style={{ color: 'var(--theme-elevation-500)', fontSize: '14px', margin: '0' }}>
            Set up the provider → Choose the content → Refine the behavior.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button buttonStyle="secondary" el="link" to={`${adminRoute}/globals/ai-providers`}>
            Providers
          </Button>
          <Button disabled={isSaving} onClick={handleSave}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div style={{ padding: '24px var(--gutter-h)' }}>
        <h5 style={{ marginBottom: '15px' }}>
          Select the collections where AI features should be available, toggle them on or off, and
          save your changes.
        </h5>
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
                    : collection.labels?.singular?.en || collection.slug}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
