'use client'

import { useEffect, useState } from 'react'

/**
 * Cached AI settings data.
 * Module-level cache prevents redundant fetches when multiple components mount simultaneously.
 */
let cachedData: AISettingsData | null = null
let fetchPromise: null | Promise<AISettingsData | null> = null

interface AISettingsData {
  [key: string]: unknown
  enabledCollections?: string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providers?: any[]
}

/**
 * Shared hook for fetching AI settings from `/api/globals/ai-providers`.
 *
 * Features:
 * - Module-level cache to prevent redundant fetches across components
 * - Deduplicates in-flight requests (if 3 components mount at once, only 1 fetch fires)
 * - Optional `depth` parameter for controlling response depth
 *
 * @example
 * ```ts
 * const { data, isLoading } = useAISettings()
 * const providers = data?.providers ?? []
 * ```
 */
export function useAISettings(options?: { depth?: number }) {
  const depth = options?.depth ?? 1
  const [data, setData] = useState<AISettingsData | null>(cachedData)
  const [isLoading, setIsLoading] = useState(!cachedData)

  useEffect(() => {
    // Already cached — skip fetch
    if (cachedData) {
      setData(cachedData)
      setIsLoading(false)
      return
    }

    // Deduplicate in-flight requests
    if (!fetchPromise) {
      fetchPromise = fetch(`/api/globals/ai-providers?depth=${depth}`, {
        credentials: 'include',
      })
        .then(async (res) => {
          if (res.ok) {
            const json = await res.json()
            cachedData = json
            return json as AISettingsData
          }
          return null
        })
        .catch(() => null)
        .finally(() => {
          fetchPromise = null
        })
    }

    void fetchPromise.then((result) => {
      setData(result)
      setIsLoading(false)
    })
  }, [depth])

  return { data, isLoading }
}

/**
 * Invalidate the cached AI settings, forcing the next `useAISettings` call to re-fetch.
 * Useful after saving settings.
 */
export function invalidateAISettings(): void {
  cachedData = null
  fetchPromise = null
}
