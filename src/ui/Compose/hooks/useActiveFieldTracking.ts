'use client'

import { useEffect } from 'react'

/**
 * Allowed field type classes that should show the active state
 */
const ALLOWED_FIELD_TYPES = ['upload', 'text', 'textarea', 'rich-text-lexical']

// Performance optimization: Cache container and field type lookups
const containerCache = new WeakMap<HTMLElement, HTMLElement | null>()
const fieldTypeCache = new WeakMap<HTMLElement, boolean>()

// Performance optimization: Throttle/debounce timers
let pointerDownThrottleTimer: null | number = null
let focusDebounceTimer: null | number = null

let currentContainer: HTMLElement | null = null
let lastContainer: HTMLElement | null = null // Track last valid container to restore if needed
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
 * Performance: Early exit if not in a listbox/option element
 */
const findContainerFromReactSelect = (target: HTMLElement): HTMLElement | null => {
  // Early exit if element doesn't have role indicator for React Select
  const role = target.getAttribute('role')
  if (!role || !['listbox', 'option'].includes(role)) {
    return null
  }

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
 * Performance: Uses WeakMap cache to avoid repeated class list checks
 */
const isAllowedFieldType = (container: HTMLElement): boolean => {
  // Check cache first
  if (fieldTypeCache.has(container)) {
    return fieldTypeCache.get(container)!
  }

  // Compute and cache result
  const result = ALLOWED_FIELD_TYPES.some(
    (type) =>
      container.classList.contains(type) || container.classList.contains(`field-type-${type}`),
  )

  fieldTypeCache.set(container, result)
  return result
}

/**
 * Resolve the .field-type container for a given event target
 * Only returns containers that match allowed field types
 * Performance: Uses WeakMap cache to avoid repeated DOM traversals
 */
const resolveContainerFromTarget = (target: EventTarget | null): HTMLElement | null => {
  if (!(target instanceof HTMLElement)) {
    return null
  }

  // Check cache first
  if (containerCache.has(target)) {
    const cached = containerCache.get(target)!
    // Validate cache entry is still in DOM
    if (!cached || cached.isConnected) {
      return cached
    }
    // Invalidate stale cache entry
    containerCache.delete(target)
  }

  // Perform lookup
  let container = target.closest<HTMLElement>('.field-type')

  // Fall back to React Select logic if needed
  if (!container) {
    container = findContainerFromReactSelect(target)
  }

  // Validate field type and cache result
  const result = container && isAllowedFieldType(container) ? container : null
  containerCache.set(target, result)

  return result
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
    lastContainer = next // Update last known valid container
  }
  currentContainer = next
}

const clearActiveContainer = (): void => {
  if (currentContainer) {
    currentContainer.classList.remove('ai-plugin-active')
    currentContainer = null
    // Note: We do NOT clear lastContainer here, allowing restoration
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

// Helper for interactive menu check
const checkInteractiveMenu = (e: Event): boolean => {
  // Check global flag first (most reliable for mouse/hover interactions)
  if (typeof window !== 'undefined' && window.__AI_MENU_INTERACTIVE) {
    return true
  }

  const target = e.target as Element

  // Check target directly
  if (
    target &&
    target instanceof Element &&
    (target.classList.contains('ai-interactive-menu') || target.hasAttribute('data-ai-interactive'))
  ) {
    return true
  }

  // Fallback: Check DOM path (for keyboard or specific events)
  const path = e.composedPath()
  return path.some((el) => {
    return (
      el instanceof Element &&
      (el.classList.contains('ai-interactive-menu') || el.hasAttribute('data-ai-interactive'))
    )
  })
}

/**
 * Handle focus events - only activate if focus is on an interactive element within .field-type
 * Performance: Debounced by 10ms to handle rapid focus changes
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

  // Check for interactive menu elements using composedPath for robustness
  if (typeof window !== 'undefined' && window.__AI_MENU_INTERACTIVE || checkInteractiveMenu(e)) {
    // If we lost the active state (e.g. due to pointerDown clearing it), restore it
    if (!currentContainer && lastContainer?.isConnected) {
       setActiveContainer(lastContainer)
    }
    return
  }

  // Clear any pending debounce
  if (focusDebounceTimer !== null) {
    clearTimeout(focusDebounceTimer)
  }

  // Debounce to reduce work during rapid focus changes (e.g., fast tabbing)
  focusDebounceTimer = window.setTimeout(() => {
    focusDebounceTimer = null
    const container = resolveContainerFromTarget(target)
    setActiveContainer(container)
  }, 10)
}

/**
 * Handle pointer/mouse events - only switch when clicking a different .field-type
 * Performance: Early exit for non-field clicks + 50ms throttling
 */
const onPointerDown = (e: PointerEvent): void => {
  const target = e.target
  if (!(target instanceof HTMLElement)) {
    return
  }

  // Check for interactive menu elements using composedPath
  if (typeof window !== 'undefined' && window.__AI_MENU_INTERACTIVE || checkInteractiveMenu(e)) {
    return
  }

  // Early exit if clicking within current container
  if (currentContainer?.isConnected && currentContainer.contains(target)) {
    return
  }

  // Performance: Quick check before expensive traversal
  // If click is nowhere near a field, just clear active state
  if (!target.closest('.field-type')) {
    if (currentContainer) {
      setActiveContainer(null)
    }
    return
  }

  // Throttle to prevent excessive work on rapid clicking
  if (pointerDownThrottleTimer !== null) {
    return
  }

  const container = resolveContainerFromTarget(target)
  setActiveContainer(container)

  // Set throttle timer for 50ms
  pointerDownThrottleTimer = window.setTimeout(() => {
    pointerDownThrottleTimer = null
  }, 50)
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
