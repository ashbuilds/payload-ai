'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

import './body.css'

import React, { useEffect } from 'react'
import { useStickToBottom } from 'use-stick-to-bottom'

import { PLUGIN_API_ENDPOINT_AGENT_CHAT } from '../../defaults.js'
import { AgentInput } from '../AgentInput/AgentInput.js'
import styles from './agent-sidebar.module.css'
import { MessageItem } from './MessageItem.js'

type AgentSidebarProps = {
  onCloseAction?: () => void
  open?: boolean
}

export const AgentSidebar: React.FC<AgentSidebarProps> = ({ onCloseAction, open = false }) => {
  useEffect(() => {
    const b = document.body
    if (!b) {
      return
    }
    b.style.setProperty('--agent-sider-w', `340px`)
    if (open) {
      b.classList.add('agent-sider-open')
    } else {
      b.classList.remove('agent-sider-open')
    }
    return () => b.classList.remove('agent-sider-open')
  }, [open])

  const { error, messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: `/api${PLUGIN_API_ENDPOINT_AGENT_CHAT}` }),
  })
  const isLoading = status === 'submitted' || status === 'streaming'

  const { contentRef, scrollRef } = useStickToBottom()

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

      <div className={styles.body} ref={scrollRef}>
        <div aria-live="polite" aria-relevant="additions" ref={contentRef}>
          {messages.map((m) => (
            <MessageItem key={m.id} message={m} />
          ))}
          {isLoading ? <div className={styles.message}>Thinking…</div> : null}
          {error ? (
            <div className={`${styles.message} ${styles.errorText}`} role="alert">
              Error: {String(error?.message || error)}
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.footer}>
        <AgentInput
          disabled={isLoading}
          onSend={async (msg) => {
            await sendMessage({ text: msg })
          }}
          placeholder="How can I help you…"
        />
      </div>
    </div>
  )
}
