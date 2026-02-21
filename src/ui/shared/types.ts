/**
 * Shared UI types used across multiple components.
 */
export interface Voice {
  category?: string
  enabled?: boolean
  id: string
  labels?: Record<string, unknown>
  name: string
  preview_url?: string
}

