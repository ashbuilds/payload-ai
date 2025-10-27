'use client'

import {
  type DynamicToolUIPart,
  getToolOrDynamicToolName,
  isToolOrDynamicToolUIPart,
  type ToolUIPart,
} from 'ai'
import React from 'react'

import styles from './agent-sidebar.module.css'
import { JsonView } from './JsonView.js'

export type ToolInvocationProps = {
  part: DynamicToolUIPart | ToolUIPart<any>
}

const StateBadge: React.FC<{ error?: boolean; preliminary?: boolean; state: string }> = ({
  error,
  preliminary,
  state,
}) => {
  const base = `${styles.badge} ${error ? styles.badgeError : ''}`
  switch (state) {
    case 'input-available':
      return <span className={`${base} ${styles.badgeAvailable}`}>tool input</span>
    case 'input-streaming':
      return <span className={`${base} ${styles.badgeStreaming}`}>tool input…</span>
    case 'output-available':
      return (
        <span className={`${base} ${styles.badgeAvailable}`}>
          tool result{preliminary ? ' (prelim)' : ''}
        </span>
      )
    case 'output-error':
      return <span className={`${base} ${styles.badgeError}`}>tool error</span>
    default:
      return <span className={base}>{state}</span>
  }
}

export const ToolInvocation: React.FC<ToolInvocationProps> = ({ part }) => {
  if (!isToolOrDynamicToolUIPart(part)) {
    return null
  }

  const toolName = getToolOrDynamicToolName(part as any)
  const state = (part as any).state as
    | 'input-available'
    | 'input-streaming'
    | 'output-available'
    | 'output-error'
  const providerExecuted = (part as any).providerExecuted as boolean | undefined
  const preliminary = (part as any).preliminary as boolean | undefined
  const errorText = (part as any).errorText as string | undefined
  const callProviderMetadata = (part as any).callProviderMetadata as
    | Record<string, unknown>
    | undefined

  return (
    <div className={styles.tool}>
      <div className={styles.toolHeader}>
        <span className={styles.toolName}>{String(toolName)}</span>
        <StateBadge error={state === 'output-error'} preliminary={preliminary} state={state} />
        {providerExecuted ? (
          <span className={`${styles.badge} ${styles.badgeSmall}`}>provider</span>
        ) : null}
      </div>

      {state === 'input-streaming' ? (
        <>
          {'input' in part && part.input !== undefined ? (
            <JsonView collapsed data={(part as any).input} label="Input (streaming)" />
          ) : null}
        </>
      ) : null}

      {state === 'input-available' ? (
        <>
          <JsonView collapsed data={(part as any).input} label="Input" />
          {callProviderMetadata ? (
            <JsonView collapsed data={callProviderMetadata} label="Provider metadata" />
          ) : null}
        </>
      ) : null}

      {state === 'output-available' ? (
        <>
          <JsonView collapsed data={(part as any).input} label="Input" />
          <JsonView data={(part as any).output} label="Output" />
          {preliminary ? <div className={styles.note}>Preliminary result</div> : null}
          {callProviderMetadata ? (
            <JsonView collapsed data={callProviderMetadata} label="Provider metadata" />
          ) : null}
        </>
      ) : null}

      {state === 'output-error' ? (
        <>
          <div className={`${styles.message} ${styles.errorText}`} role="alert">
            {errorText || 'Tool execution error'}
          </div>
          {'rawInput' in part && (part as any).rawInput !== undefined ? (
            <JsonView collapsed data={(part as any).rawInput} label="Raw input" />
          ) : 'input' in part && (part as any).input !== undefined ? (
            <JsonView collapsed data={(part as any).input} label="Input" />
          ) : null}
          {callProviderMetadata ? (
            <JsonView collapsed data={callProviderMetadata} label="Provider metadata" />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export default ToolInvocation
