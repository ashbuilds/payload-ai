'use client'

import React from 'react'

import styles from './agent-sidebar.module.css'

type AgentSidebarProps = {
  onCloseAction?: () => void
  open?: boolean
}

export const AgentSidebar: React.FC<AgentSidebarProps> = ({ onCloseAction, open = false }) => {
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
        <button
          aria-label="Close agent panel"
          className={styles.iconButton}
          onClick={onCloseAction}
          type="button"
        >
          ×
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.placeholder}>
          <p className={styles.placeholderTitle}>Agent chat</p>
          <p className={styles.placeholderText}>
            UI placeholder. Streaming and persistence will be added later.
          </p>
        </div>
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
