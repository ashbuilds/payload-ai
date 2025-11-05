'use client'

import { useEffect } from 'react'

let currentContainer: HTMLElement | null = null

/**
 * Safely escape CSS selector values
 */
const cssEscape = (value: string): string => {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }
  return value.replace(/([ #;?%&,.+*~':"!^$[\]()=>|/@])/g, '\\$1')
}

/**
 * Find container from React Select dropdown elements
 */
const findContainerFromReactSelect = (target: HTMLElement): HTMLElement | null => {
  const listbox = target.closest<HTMLElement>('[role="listbox"]')
  if (!listbox?.id) {
    return null
  }

  const id = cssEscape(listbox.id)
  const selector = `[aria-controls="${id}"], [aria-owns="${id}"]`
  const control = document.querySelector<HTMLElement>(selector)

  return control?.closest<HTMLElement>('.field-type') ?? null
}

/**
 * Resolve the .field-type container for a given event target
 */
const resolveContainerFromTarget = (target: EventTarget | null): HTMLElement | null => {
  if (!(target instanceof HTMLElement)) {
    return null
  }

  // Check for direct parent first
  const direct = target.closest<HTMLElement>('.field-type')
  if (direct) {
    return direct
  }

  // Fall back to React Select logic
  return findContainerFromReactSelect(target)
}

/**
 * Update the active container and toggle CSS class
 * - Avoids acting on disconnected nodes
 * - Avoids redundant class work
 */
const setActiveContainer = (next: HTMLElement | null): void => {
  // Normalize both references against disconnected nodes
  if (currentContainer && !currentContainer.isConnected) {
    currentContainer = null
  }
  if (next && !next.isConnected) {
    next = null
  }

  if (currentContainer === next) {
    return
  }

  currentContainer?.classList.remove('ai-plugin-active')
  if (next) {
    next.classList.add('ai-plugin-active')
  }
  currentContainer = next
}

const clearActiveContainer = (): void => {
  if (currentContainer) {
    currentContainer.classList.remove('ai-plugin-active')
    currentContainer = null
  }
}

const isInteractiveElement = (element: HTMLElement): boolean => {
  const tagName = element.tagName.toLowerCase()
  const interactiveTags = ['input', 'textarea', 'select', 'button']

  if (interactiveTags.includes(tagName)) {
    return true
  }

  // Check for contenteditable
  if (element.isContentEditable) {
    return true
  }

  // Check for elements with role="textbox" or role="combobox" (React Select)
  const role = element.getAttribute('role')
  if (role && ['combobox', 'listbox', 'searchbox', 'textbox'].includes(role)) {
    return true
  }

  return false
}

/**
 * Handle focus events - only activate if focus is on an interactive element within .field-type
 * Includes early-bail when focus moves within the same active container
 */
const onFocusIn = (e: FocusEvent): void => {
  const target = e.target
  if (!(target instanceof HTMLElement)) {
    return
  }

  // Early exit if we're already inside the current container
  if (currentContainer && currentContainer.contains(target)) {
    return
  }

  // Only activate if the focused element is actually interactive
  if (!isInteractiveElement(target)) {
    return
  }

  const container = resolveContainerFromTarget(target)
  if (container) {
    setActiveContainer(container)
  }
}

/**
 * Handle pointer/mouse events - only switch when clicking a different .field-type
 * Includes early-bail when clicking within the same active container
 */
const onPointerDown = (e: PointerEvent): void => {
  const target = e.target
  if (!(target instanceof HTMLElement)) {
    return
  }

  if (currentContainer && currentContainer.contains(target)) {
    // Clicking inside the active container doesn't require any work
    return
  }

  const container = resolveContainerFromTarget(target)
  if (container) {
    setActiveContainer(container)
  }
}

/**
 * Handle keyboard navigation (Tab key)
 */
const onKeyDown = (e: KeyboardEvent): void => {
  if (e.key !== 'Tab') {
    return
  }

  // Defer until after focus has shifted
  requestAnimationFrame(() => {
    const container = resolveContainerFromTarget(document.activeElement)
    setActiveContainer(container)
  })
}

/**
 * Handle visibility changes to avoid stale references when page/section is hidden.
 */
const onVisibilityChange = (): void => {
  if (typeof document !== 'undefined' && (document as { hidden?: boolean } & Document).hidden) {
    // Clear active state to avoid keeping stale DOM references alive
    setActiveContainer(null)
  }
}

/**
 * Initialize document-level listeners to track the active field container.
 * When a container is active, it receives the 'ai-plugin-active' class.
 */
export const useActiveFieldTracking = (): void => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const pluginWindow = window as {
      __aiComposeTracking?: boolean
      __aiComposeTrackingController?: AbortController
      __aiComposeTrackingCount?: number
    } & Window

    // Track number of mounted users of the hook
    pluginWindow.__aiComposeTrackingCount = (pluginWindow.__aiComposeTrackingCount ?? 0) + 1

    // Initialize listeners only once
    if (!pluginWindow.__aiComposeTracking) {
      const controller = new AbortController()
      pluginWindow.__aiComposeTrackingController = controller

      // Use capture for early handling; mark pointerdown passive to minimize main-thread impact
      document.addEventListener('focusin', onFocusIn, { capture: true, signal: controller.signal })
      document.addEventListener('pointerdown', onPointerDown, {
        capture: true,
        passive: true,
        signal: controller.signal,
      })
      document.addEventListener('keydown', onKeyDown, { capture: true, signal: controller.signal })
      document.addEventListener('visibilitychange', onVisibilityChange, {
        signal: controller.signal,
      })

      pluginWindow.__aiComposeTracking = true
    }

    return () => {
      // Decrement and cleanup when the last user unmounts
      pluginWindow.__aiComposeTrackingCount = (pluginWindow.__aiComposeTrackingCount ?? 1) - 1

      if ((pluginWindow.__aiComposeTrackingCount ?? 0) <= 0) {
        // Atomically remove all listeners that were registered with the controller
        pluginWindow.__aiComposeTrackingController?.abort()
        pluginWindow.__aiComposeTrackingController = undefined

        // Clear active state and references
        clearActiveContainer()

        pluginWindow.__aiComposeTracking = false
        pluginWindow.__aiComposeTrackingCount = 0
      }
    }
  }, [])
}
