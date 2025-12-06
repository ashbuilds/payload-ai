'use client'

import type { FC } from 'react'

import React, { useEffect, useRef, useState } from 'react'

import type { ComposeProps } from './Compose.js'

import { Compose } from './Compose.js'

/**
 * Lightweight placeholder component that lazy-loads Compose when field becomes active.
 * Uses MutationObserver to watch for .ai-plugin-active class added by useActiveFieldTracking.
 */
export const ComposePlaceholder: FC<ComposeProps> = (props) => {
  const [shouldMount, setShouldMount] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const unmountTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    // Find the parent .field-type container
    const fieldContainer = container.closest('.field-type')
    if (!fieldContainer) {
      return
    }

    // Watch for .ai-plugin-active class changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          if (fieldContainer.classList.contains('ai-plugin-active')) {
            // Field is active - mount Compose and cancel any pending unmount
            if (unmountTimerRef.current) {
              clearTimeout(unmountTimerRef.current)
              unmountTimerRef.current = null
            }
            setShouldMount(true)
          } else if (shouldMount) {
            // Field is inactive - schedule unmount after delay
            if (unmountTimerRef.current) {
              clearTimeout(unmountTimerRef.current)
            }
            unmountTimerRef.current = setTimeout(() => {
              setShouldMount(false)
              unmountTimerRef.current = null
            }, 1200) // 500ms delay to prevent rapid remounting
          }
          break
        }
      }
    })

    observer.observe(fieldContainer, {
      attributeFilter: ['class'],
      attributes: true,
    })

    // Check initial state in case field is already active
    if (fieldContainer.classList.contains('ai-plugin-active')) {
      setShouldMount(true)
    }

    return () => {
      observer.disconnect()
      if (unmountTimerRef.current) {
        clearTimeout(unmountTimerRef.current)
      }
    }
  }, [shouldMount])

  return (
    <div ref={containerRef} style={{ display: 'contents' }}>
      {shouldMount ? <Compose {...props} /> : null}
    </div>
  )
}
