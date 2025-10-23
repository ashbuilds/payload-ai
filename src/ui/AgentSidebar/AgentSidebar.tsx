'use client'

import React, { useEffect } from 'react'

import "./body.css"
import styles from './agent-sidebar.module.css'

type AgentSidebarProps = {
  onCloseAction?: () => void
  open?: boolean
}

export const AgentSidebar: React.FC<AgentSidebarProps> = ({ onCloseAction, open = false }) => {
  useEffect(() => {
    const b = document.body
    if (!b) return
    b.style.setProperty('--agent-sider-w', `340px`)
    if (open) b.classList.add('agent-sider-open')
    else b.classList.remove('agent-sider-open')
    return () => b.classList.remove('agent-sider-open')
  }, [open])

  return (
    <div
      aria-label="AI Agent Sidebar"
      className={`${styles.panel} ${open ? styles.open : ''}`}
      data-plugin="ai-agent-sidebar"
      role="complementary"
    >
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.badge}>AI</span>
          <span>Agent</span>
        </div>
      </div>

      <div className={styles.body}>

      </div>

      <div className={styles.footer}>
        <input
          className={styles.input}
          disabled
          placeholder="Type a message… (disabled)"
          type="text"
        />
        <button className={styles.send} disabled type="button">
          Send
        </button>
      </div>
    </div>
  )
}

export default AgentSidebar
