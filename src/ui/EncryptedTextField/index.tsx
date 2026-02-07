'use client'

import { Button, useField } from '@payloadcms/ui'
import React, { useState } from 'react'

type Props = {
  label?: string
  path: string
  required?: boolean
}

export const EncryptedTextField: React.FC<Props> = ({ label, path, required }) => {
  const { setValue, value } = useField<string>({ path })
  const [isEditing, setIsEditing] = useState(!value)

  const isMasked = typeof value === 'string' && value.startsWith('sk-') && value.includes('****')

  return (
    <div className="field-type text">
      <label className="field-label">
        {label || 'API Key'}
        {required && <span className="required">*</span>}
      </label>

      {!isEditing && isMasked ? (
        <div style={{ alignItems: 'center', display: 'flex', gap: '10px' }}>
          <div
            style={{
              background: 'var(--theme-elevation-100)',
              borderRadius: '4px',
              flexGrow: 1,
              fontFamily: 'monospace',
              padding: '8px 12px',
            }}
          >
            {value}
            <span
              style={{ color: 'var(--theme-success-500)', fontSize: '0.8em', marginLeft: '10px' }}
            >
              ✓ Configured
            </span>
          </div>
          <Button
            buttonStyle="secondary"
            onClick={() => {
              setValue('')
              setIsEditing(true)
            }}
            size="medium"
          >
            Change
          </Button>
        </div>
      ) : (
        <input
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-..."
          style={{ width: '100%' }}
          type="password"
          value={value || ''}
        />
      )}
    </div>
  )
}
