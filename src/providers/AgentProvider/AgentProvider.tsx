'use client'

import React from 'react'

import styles from '../../ui/AgentSidebar/agent-sidebar.module.css'
import { AgentSidebar } from '../../ui/AgentSidebar/AgentSidebar.js'
import { PluginIcon } from '../../ui/Icons/Icons.js'

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = React.useState(true)

  return (
    <>
      {children}

      <button
        aria-label="Open AI Agent sidebar"
        className={`${styles.launcher} ${open ? styles.launcherActive : ''}`}
        onClick={() => setOpen(!open)}
        type="button"
      >
        <PluginIcon hasDivider={false} isLoading={false} />
        {/*<span>Compose</span>*/}
      </button>
      <AgentSidebar onCloseAction={() => setOpen(false)} open={open} />
    </>
  )
}

export default AgentProvider
