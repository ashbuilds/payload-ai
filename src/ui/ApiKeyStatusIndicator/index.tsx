'use client'

import { useField } from '@payloadcms/ui'
import React from 'react'

type Props = {
  path: string
}

export const ApiKeyStatusIndicator: React.FC<Props> = ({ path }) => {
  const { value } = useField<string>({ path })
  const hasKey = !!value

  if (!hasKey) {return null}

  return (
    <div style={{ 
      alignItems: 'center', 
      backgroundColor: 'var(--theme-success-100)', 
      borderRadius: '4px',
      color: 'var(--theme-success-700)',
      display: 'inline-flex',
      fontSize: '12px',
      fontWeight: 'bold',
      gap: '6px',
      padding: '4px 8px'
    }}>
      <span style={{ 
        backgroundColor: 'currentColor', 
        borderRadius: '50%', 
        height: '8px', 
        width: '8px' 
      }} />
      Active
    </div>
  )
}
