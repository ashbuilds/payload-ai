'use client'

import { type UIMessage } from 'ai'
import React from 'react'

import styles from './agent-sidebar.module.css'
import { PartRenderer } from './PartRenderer.js'

export type MessageItemProps = {
  className?: string
  message: UIMessage
}

export const MessageItem: React.FC<MessageItemProps> = ({ className, message }) => {
  const roleLabel = message.role === 'user' ? 'You' : message.role === 'assistant' ? 'AI' : 'System'

  return (
    <div className={`${styles.message} ${className || ''}`}>
      <div className={styles.role}>{roleLabel}</div>
      <div className={styles.parts}>
        {message.parts?.map((part, idx) => (
          <PartRenderer key={idx} part={part} />
        ))}
      </div>
    </div>
  )
}

export default MessageItem
