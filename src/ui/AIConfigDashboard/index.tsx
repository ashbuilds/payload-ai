'use client'

import React from 'react'

export const AIConfigDashboard: React.FC = () => {
  return (
    <div
      style={{
        alignItems: 'center',
        background: 'var(--theme-elevation-50)',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '20px',
        padding: '20px',
      }}
    >
      <div>
        <h4 style={{ margin: '0 0 5px 0' }}>AI Configuration</h4>
        <p style={{ color: 'var(--theme-elevation-500)', fontSize: '14px', margin: '0' }}>
          Manage your AI providers, API keys, and default models.
        </p>
      </div>
      <a href="/admin/globals/ai-settings">
        <button className="btn btn--style-primary btn--size-small">Manage AI Settings</button>
      </a>
    </div>
  )
}
