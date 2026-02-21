'use client'

import { Button, toast, useConfig } from '@payloadcms/ui'
// @ts-expect-error - Next.js types are not resolving correctly with nodenext but runtime is fine
import { useRouter } from 'next/navigation'
import React, { use, useEffect, useState } from 'react'

import { excludeCollections } from '../../defaults.js'
import { InstructionsContext } from '../../providers/InstructionsProvider/context.js'
import styles from './configDashboard.module.css'

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
          const storedEnabled = data.enabledCollections || []
          setEnabledCollections(Array.isArray(storedEnabled) ? storedEnabled : [])
        }
      } catch (error) {
        console.error('Failed to fetch AI settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings().catch(console.error)
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
    return <div className={styles.loading}>Loading configuration...</div>
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Let's configure your AI Plugin</h2>
          <p className={styles.subtitle}>
            Set up the provider → Choose the content → Refine the behavior.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button buttonStyle="secondary" el="link" to={`${adminRoute}/globals/ai-providers`}>
            Providers
          </Button>
          <Button disabled={isSaving} onClick={handleSave}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className={styles.body}>
        <h5 className={styles.bodyTitle}>
          Select the collections where AI features should be available, toggle them on or off, and
          save your changes.
        </h5>
        <div className={styles.grid}>
          {availableCollections.map((collection) => {
            const isEnabled = enabledCollections.includes(collection.slug)
            return (
              <button
                className={styles.toggleButton}
                data-enabled={isEnabled}
                key={collection.slug}
                onClick={() => handleToggle(collection.slug)}
                type="button"
              >
                <div className={styles.toggleTrack}>
                  <div className={styles.toggleKnob} />
                </div>
                <span className={styles.toggleLabel}>
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
