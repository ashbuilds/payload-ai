'use client'

import { isToolOrDynamicToolUIPart, type UIMessagePart } from 'ai'
import React from 'react'

import styles from './agent-sidebar.module.css'
import { JsonView } from './JsonView.js'
import { ToolInvocation } from './ToolInvocation.js'

export type PartRendererProps = {
  part: UIMessagePart<any, any>
}

const isImage = (mediaType?: string) => (mediaType || '').startsWith('image/')

export const PartRenderer: React.FC<PartRendererProps> = ({ part }) => {
  // Tools (typed and dynamic)
  if (isToolOrDynamicToolUIPart(part)) {
    return <ToolInvocation part={part as any} />
  }

  switch (part.type) {
    case 'file': {
      const f = part
      if (isImage(f.mediaType)) {
        return (
          <div className={`${styles.part} ${styles.file}`}>
            <img alt={f.filename || 'image'} className={styles.fileImage} src={f.url} />
          </div>
        )
      }
      return (
        <div className={`${styles.part} ${styles.file}`}>
          <a className={styles.fileLink} href={f.url} rel="noreferrer" target="_blank">
            {f.filename || f.url}
          </a>
          <span className={`${styles.badge} ${styles.badgeSmall}`}>{f.mediaType}</span>
        </div>
      )
    }
    case 'reasoning': {
      const streaming = (part as any).state === 'streaming'
      return (
        <div className={`${styles.part} ${styles.reasoning}`}>
          {part.text}
          {streaming ? '▋' : ''}
        </div>
      )
    }
    case 'source-document': {
      return (
        <div className={`${styles.part} ${styles.source}`}>
          <span className={`${styles.badge} ${styles.badgeSmall}`}>source</span>{' '}
          <span className={styles.sourceTitle}>{part.title}</span>
          {part.filename ? <span className={styles.muted}> ({part.filename})</span> : null}
          <span className={`${styles.badge} ${styles.badgeSmall}`}>{part.mediaType}</span>
        </div>
      )
    }
    case 'source-url': {
      return (
        <div className={`${styles.part} ${styles.source}`}>
          <span className={`${styles.badge} ${styles.badgeSmall}`}>source</span>{' '}
          <a href={part.url} rel="noreferrer" target="_blank">
            {part.title || part.url}
          </a>
        </div>
      )
    }
    case 'step-start': {
      return (
        <div aria-hidden="true" className={`${styles.part} ${styles.divider}`} role="separator" />
      )
    }
    case 'text': {
      const streaming = (part as any).state === 'streaming'
      return (
        <div className={`${styles.part} ${styles.partText}`}>
          {part.text}
          {streaming ? '▋' : ''}
        </div>
      )
    }
    default: {
      // data-${NAME} parts or any future part: show as JSON
      const t = (part as any).type as string
      if (typeof t === 'string' && t.startsWith('data-')) {
        const label = t.replace(/^data-/, 'data: ')
        return (
          <div className={styles.part}>
            <JsonView collapsed data={(part as any).data} label={label} />
          </div>
        )
      }
      // Unknown: still show raw
      return (
        <div className={styles.part}>
          <JsonView collapsed data={part as any} label="Unknown part" />
        </div>
      )
    }
  }
}

export default PartRenderer
