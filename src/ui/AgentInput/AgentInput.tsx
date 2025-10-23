'use client'

import React from 'react'

import styles from './agent-input.module.css'

export type AgentInputProps = {
  autoFocus?: boolean
  className?: string
  disabled?: boolean
  maxHeight?: number
  onSend: (message: string) => void
  placeholder?: string
}

export const AgentInput: React.FC<AgentInputProps> = ({
  autoFocus = false,
  className,
  disabled = false,
  maxHeight = 200,
  onSend,
  placeholder = 'How can I help you…',
}) => {
  const [value, setValue] = React.useState('')
  const [isComposing, setIsComposing] = React.useState(false)
  const editorRef = React.useRef<HTMLTextAreaElement | null>(null)

  const resize = React.useCallback(() => {
    const el = editorRef.current
    if (!el) {
      return
    }
    // Reset to auto so scrollHeight measures full content height
    el.style.height = 'auto'
    const limit = Math.max(0, maxHeight)
    const next = Math.min(el.scrollHeight, limit)
    el.style.height = `${next}px`
    el.style.overflowY = el.scrollHeight > limit ? 'auto' : 'hidden'
  }, [maxHeight])

  React.useEffect(() => {
    resize()
  }, [value, resize])

  const send = () => {
    if (disabled) {
      return
    }
    const msg = value.trim()
    if (!msg) {
      return
    }
    onSend(msg)
    setValue('')
    // Ensure height resets after clearing
    requestAnimationFrame(resize)
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    // Shift+Enter = newline (default). Enter alone = send (when not composing).
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <textarea
        aria-label="Message the agent"
        // autoFocus={autoFocus}
        className={styles.editor}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onCompositionEnd={() => setIsComposing(false)}
        onCompositionStart={() => setIsComposing(true)}
        onInput={resize}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        ref={editorRef}
        rows={1}
        value={value}
      />
      <div className={styles.bar}>
        <button
          aria-label="Send message"
          className={styles.send}
          disabled={disabled || value.trim().length === 0}
          onClick={send}
          type="button"
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default AgentInput
