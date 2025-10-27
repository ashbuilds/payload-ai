'use client'

import React from 'react'

import styles from './agent-sidebar.module.css'

export type JsonViewProps = {
  className?: string
  collapsed?: boolean
  data: unknown
  label?: string
}

const toPrettyJson = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    // best-effort stringify
    try {
      return String(value)
    } catch {
      return '[Unserializable]'
    }
  }
}

export const JsonView: React.FC<JsonViewProps> = ({
  className,
  collapsed = false,
  data,
  label = 'Details',
}) => {
  const text = toPrettyJson(data)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // no-op
    }
  }

  return (
    <div className={`${styles.json} ${className || ''}`}>
      <details className={styles.jsonDetails} open={!collapsed}>
        <summary className={styles.jsonSummary}>
          <span className={styles.jsonLabel}>{label}</span>
          <button
            aria-label="Copy JSON"
            className={styles.copyButton}
            onClick={handleCopy}
            type="button"
          >
            Copy
          </button>
        </summary>
        <pre className={styles.code}>
          <code>{text}</code>
        </pre>
      </details>
    </div>
  )
}

export default JsonView
