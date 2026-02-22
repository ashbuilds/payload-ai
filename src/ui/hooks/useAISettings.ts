'use client'

import { useEffect, useState } from 'react'

/**
 * Cached AI settings per depth.
 * We still cache to avoid duplicate requests during a single render/mount cycle,
 * but we always revalidate on mount so changes made in AI Providers appear in Instructions.
 */
const cachedDataByDepth = new Map<number, AISettingsData | null>()
const fetchPromiseByDepth = new Map<number, Promise<AISettingsData | null>>()

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
  const initialCached = cachedDataByDepth.get(depth) ?? null
  const [data, setData] = useState<AISettingsData | null>(initialCached)
  const [isLoading, setIsLoading] = useState(!initialCached)

  useEffect(() => {
    const cached = cachedDataByDepth.get(depth) ?? null
    if (cached) {
      setData(cached)
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }

    // Deduplicate in-flight requests per depth and always revalidate on mount.
    let fetchPromise = fetchPromiseByDepth.get(depth) ?? null
    if (!fetchPromise) {
      fetchPromise = fetch(`/api/globals/ai-providers?depth=${depth}`, {
        cache: 'no-store',
        credentials: 'include',
      })
        .then(async (res) => {
          if (res.ok) {
            const json = await res.json()
            cachedDataByDepth.set(depth, json as AISettingsData)
            return json as AISettingsData
          }
          return null
        })
        .catch(() => null)
        .finally(() => {
          fetchPromiseByDepth.delete(depth)
        })

      fetchPromiseByDepth.set(depth, fetchPromise)
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
  cachedDataByDepth.clear()
  fetchPromiseByDepth.clear()
}
