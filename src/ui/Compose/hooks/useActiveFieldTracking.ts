'use client'

import { useEffect } from 'react'

/**
 * Allowed field type classes that should show the active state
 */
const ALLOWED_FIELD_TYPES = ['upload', 'text', 'textarea', 'rich-text-lexical']

let currentContainer: HTMLElement | null = null
let rafId: null | number = null // Track RAF to cancel if needed

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
 * Check if a container has one of the allowed field type classes
 */
const isAllowedFieldType = (container: HTMLElement): boolean => {
  return ALLOWED_FIELD_TYPES.some(
    (type) =>
      container.classList.contains(type) || container.classList.contains(`field-type-${type}`),
  )
}

/**
 * Resolve the .field-type container for a given event target
 * Only returns containers that match allowed field types
 */
const resolveContainerFromTarget = (target: EventTarget | null): HTMLElement | null => {
  if (!(target instanceof HTMLElement)) {
    return null
  }

  // Check for direct parent first
  let container = target.closest<HTMLElement>('.field-type')

  // If not found, fall back to React Select logic
  if (!container) {
    container = findContainerFromReactSelect(target)
  }

  // Only return if it's an allowed field type
  if (container && isAllowedFieldType(container)) {
    return container
  }

  return null
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

  // Cancel any pending RAF
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
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
 */
const onFocusIn = (e: FocusEvent): void => {
  const target = e.target
  if (!(target instanceof HTMLElement)) {
    return
  }

  // Early exit if we're already inside the current container
  if (currentContainer?.isConnected && currentContainer.contains(target)) {
    return
  }

  // Only activate if the focused element is actually interactive
  if (!isInteractiveElement(target)) {
    return
  }

  const container = resolveContainerFromTarget(target)
  setActiveContainer(container)
}

/**
 * Handle pointer/mouse events - only switch when clicking a different .field-type
 */
const onPointerDown = (e: PointerEvent): void => {
  const target = e.target
  if (!(target instanceof HTMLElement)) {
    return
  }

  // Early exit if clicking within current container
  if (currentContainer?.isConnected && currentContainer.contains(target)) {
    return
  }

  const container = resolveContainerFromTarget(target)
  setActiveContainer(container)
}

/**
 * Handle keyboard navigation (Tab key)
 */
const onKeyDown = (e: KeyboardEvent): void => {
  if (e.key !== 'Tab') {
    return
  }

  // Cancel any pending RAF to prevent queuing
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }

  // Defer until after focus has shifted
  rafId = requestAnimationFrame(() => {
    rafId = null
    const container = resolveContainerFromTarget(document.activeElement)
    setActiveContainer(container)
  })
}

/**
 * Handle visibility changes to properly cleanup when page is hidden
 */
const onVisibilityChange = (): void => {
  if (typeof document !== 'undefined' && document.hidden) {
    // Clear active state and cancel pending operations
    clearActiveContainer()
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

      // Use capture for early handling
      document.addEventListener('focusin', onFocusIn, {
        capture: true,
        signal: controller.signal,
      })
      document.addEventListener('pointerdown', onPointerDown, {
        capture: true,
        passive: true,
        signal: controller.signal,
      })
      document.addEventListener('keydown', onKeyDown, {
        capture: true,
        signal: controller.signal,
      })
      document.addEventListener('visibilitychange', onVisibilityChange, {
        signal: controller.signal,
      })

      pluginWindow.__aiComposeTracking = true
    }

    return () => {
      // Decrement and cleanup when the last user unmounts
      pluginWindow.__aiComposeTrackingCount = (pluginWindow.__aiComposeTrackingCount ?? 1) - 1

      if ((pluginWindow.__aiComposeTrackingCount ?? 0) <= 0) {
        // Atomically remove all listeners
        pluginWindow.__aiComposeTrackingController?.abort()
        pluginWindow.__aiComposeTrackingController = undefined

        // Clear active state and cancel pending operations
        clearActiveContainer()

        // Reset all state
        pluginWindow.__aiComposeTracking = false
        pluginWindow.__aiComposeTrackingCount = 0
      }
    }
  }, [])
}
