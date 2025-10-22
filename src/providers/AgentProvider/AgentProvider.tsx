'use client'

import React from 'react'

import styles from '../../ui/AgentSidebar/agent-sidebar.module.css'
import { AgentSidebar } from '../../ui/AgentSidebar/AgentSidebar.js'

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = React.useState(true)

  return (
    <>
      {children}

      {!open && (
        <button
          aria-label="Open AI Agent sidebar"
          className={styles.launcher}
          onClick={() => setOpen(true)}
          type="button"
        >
          <span>AI Agent</span>
        </button>
      )}

      <AgentSidebar onCloseAction={() => setOpen(false)} open={open} />
    </>
  )
}

export default AgentProvider
