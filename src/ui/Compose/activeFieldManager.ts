'use client'

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
 */
const setActiveContainer = (next: HTMLElement | null): void => {
  if (currentContainer === next) {
    return
  }

  currentContainer?.classList.remove('ai-plugin-active')
  next?.classList.add('ai-plugin-active')
  currentContainer = next
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

  // Only activate if the focused element is actually interactive
  if (!isInteractiveElement(target)) {
    return
  }

  const container = resolveContainerFromTarget(target)
  // Only update if we found a new container
  if (container) {
    setActiveContainer(container)
  }
}

/**
 * Handle pointer/mouse events - only switch when clicking a different .field-type
 */
const onPointerDown = (e: PointerEvent): void => {
  const target = e.target
  if (!(target instanceof HTMLElement)) {
    return
  }

  const container = resolveContainerFromTarget(target)

  // Only update if we found a container (keeps last active if clicking elsewhere)
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

  requestAnimationFrame(() => {
    const container = resolveContainerFromTarget(document.activeElement)
    setActiveContainer(container)
  })
}

/**
 * Initialize document-level listeners to track the active field container.
 * When a container is active, it receives the 'ai-plugin-active' class.
 */
export const initActiveFieldTracking = (): void => {
  if (typeof window === 'undefined') {
    return
  }

  const pluginWindow = window as { __aiComposeTracking?: boolean } & Window
  // Prevent multiple initializations
  if (pluginWindow.__aiComposeTracking) {
    return
  }

  document.addEventListener('focusin', onFocusIn, true)
  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('keydown', onKeyDown, true)

  pluginWindow.__aiComposeTracking = true
}
