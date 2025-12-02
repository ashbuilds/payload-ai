'use client'

import type { ArrayFieldLabelClientComponent } from 'payload'

import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

/**
 * Generic Model Row Label component for provider blocks
 * Displays model name with enabled status badge
 */
export const ModelRowLabel: ArrayFieldLabelClientComponent = () => {
  const { data, rowNumber } = useRowLabel<{
    enabled?: boolean
    id?: string
    name?: string
  }>()

  const displayName = data?.name || data?.id || `Model ${rowNumber}`
  const isEnabled = data?.enabled !== false

  return (
    <div style={{ alignItems: 'center', display: 'flex', gap: '10px' }}>
      <span style={{ fontWeight: '500' }}>{displayName}</span>
      <span
        style={{
          backgroundColor: isEnabled ? 'var(--theme-success-100)' : 'var(--theme-elevation-200)',
          borderRadius: '4px',
          color: isEnabled ? 'var(--theme-success-700)' : 'var(--theme-elevation-600)',
          fontSize: '11px',
          fontWeight: '600',
          padding: '2px 8px',
          textTransform: 'uppercase',
        }}
      >
        {isEnabled ? '●Enabled' : 'Disabled'}
      </span>
    </div>
  )
}
