/**
 * OG Creator: Kailash Nadh
 * Github: https://github.com/knadh/floatype.js
 *
 * Reacted By: Claude 3.5 Sonnet and Ashbuilds
 * Warning: May contain nonsensical code
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'

import styles from './floatype.module.scss'

type Options<T> = {
  debounce?: number
  onNavigate?: (direction: number, items: T[], currentIndex: number) => void
  onQuery: (query: string) => T[]
  onRender?: (item: T) => React.ReactNode
  onSelect?: (item: T, query: string) => string
  onUpdate: (value: string) => void
}

type FloatypeProps<T> = {
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>
  options: Partial<Options<T>>
}

export function Floatype<T>({ inputRef, options }: FloatypeProps<T>) {
  const [items, setItems] = useState<T[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [query, setQuery] = useState<null | string>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null)

  const opt: Options<T> = {
    debounce: 100,
    onNavigate: undefined,
    onQuery: () => [],
    onRender: undefined,
    onSelect: undefined,
    onUpdate: () => {},
    ...options,
  }

  const destroy = useCallback(() => {
    setItems([])
    setCurrentIndex(0)
    setQuery(null)
  }, [])

  const getLastWord = useCallback((el: HTMLInputElement | HTMLTextAreaElement): null | string => {
    const text = el.value.substring(0, el.selectionStart ?? 0)
    const match = text.match(/\S+\s*$/)
    return match ? match[0] : null
  }, [])

  const handleBlur = useCallback(() => {
    // Uncomment the following line if you want to destroy on blur
    destroy()
  }, [])

  useEffect(() => {
    const fetchItems = () => {
      if (!query) return
      const newItems = opt.onQuery(query)
      setItems(newItems)
    }

    const timeoutId = setTimeout(fetchItems, opt.debounce)
    return () => clearTimeout(timeoutId)
  }, [query, opt.onQuery, opt.debounce])

  useEffect(() => {
    if (opt.onNavigate) {
      opt.onNavigate(1, items, currentIndex)
    }
  }, [currentIndex, items, opt])

  useEffect(() => {
    if (!shadowRef.current || !inputRef.current) return

    const shadow = shadowRef.current
    const el = inputRef.current

    const stylesCss = window.getComputedStyle(el)
    for (const p of stylesCss) {
      shadow.style[p] = stylesCss[p]
    }

    shadow.style.position = 'absolute'
    shadow.style.padding = '0.9rem 1.4rem'
    shadow.style.minHeight = 'calc(5.8rem + 32px)'
    shadow.style.visibility = 'hidden'
  }, [inputRef])

  const getCaret = useCallback((): { x: number; y: number } | null => {
    if (!inputRef.current || !shadowRef.current) return null

    const el = inputRef.current
    const shadow = shadowRef.current

    const txt = el.value.substring(0, el.selectionStart ?? 0)
    const start = Math.max(txt.lastIndexOf('\n'), txt.lastIndexOf(' ')) + 1

    const cl = 'floatype-caret'
    shadow.innerHTML =
      el.value.substring(0, start) +
      `<span id="${cl}" style="display: inline-block;">${el.value.substring(start)}</span>`

    const m = shadow.querySelector(`#${cl}`)
    const rect = el.getBoundingClientRect()
    const rectM = m?.getBoundingClientRect()

    let top = rect.top + (rect.top - rectM.top)
    let left = rectM.left - 32 * 2 + rectM.width
    if (boxRef.current && currentIndex) {
      const box = boxRef.current
      const selected = box.children[currentIndex] as HTMLElement
      if (selected) {
        top -= selected.offsetTop + (selected.clientHeight / 2 - 5)
      }
    }
    if (boxRef.current) {
      const box = boxRef.current
      if (box.clientWidth + left + 50 > window.innerWidth) {
        left = left - box.offsetWidth - 50
      }
    }

    return {
      x: left,
      y: top,
    }
  }, [inputRef, shadowRef, boxRef, currentIndex])

  const insertWord = useCallback(
    (el: HTMLInputElement | HTMLTextAreaElement, val: string): void => {
      const start =
        Math.max(
          el.value.lastIndexOf(' ', (el.selectionStart ?? 0) - 1),
          el.value.lastIndexOf('\n', (el.selectionStart ?? 0) - 1),
        ) + 1
      el.value =
        el.value.substring(0, start) +
        val +
        (el.value[el.selectionStart ?? 0] !== ' ' ? ' ' : '') +
        el.value.substring(el.selectionStart ?? 0)
      el.setSelectionRange(start + val.length + 1, start + val.length + 1)

      opt.onUpdate(el.value)
    },
    [opt],
  )

  const handleInput = useCallback(() => {
    if (!inputRef.current) return
    const w = getLastWord(inputRef.current)
    if (!w) {
      destroy()
      return
    }
    setQuery(w)
  }, [inputRef, getLastWord, destroy])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!boxRef.current) return

      switch (e.keyCode) {
        case 38: // Up arrow
          e.preventDefault()
          setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
          break
        case 40: // Down arrow
          e.preventDefault()
          setCurrentIndex((prev) => (prev + 1) % items.length)
          break
        case 9: // Tab
        case 32: // Space
          break
        case 13: // Enter
          e.preventDefault()
          if (inputRef.current) {
            const selectedItem = items[currentIndex]
            const newVal = opt.onSelect
              ? opt.onSelect(selectedItem, query)
              : (selectedItem as unknown as string)
            insertWord(inputRef.current, newVal)
          }
          destroy()
          break
        case 27: // Escape
          destroy()
          break
      }
    },
    [boxRef, items, currentIndex, inputRef, opt.onSelect, insertWord, destroy, query],
  )

  useEffect(() => {
    if (!inputRef.current) return

    const el = inputRef.current
    el.addEventListener('input', handleInput)
    el.addEventListener('keydown', handleKeyDown as any)
    el.addEventListener('blur', handleBlur)

    return () => {
      el.removeEventListener('input', handleInput)
      el.removeEventListener('keydown', handleKeyDown as any)
      el.removeEventListener('blur', handleBlur)
    }
  }, [inputRef, handleInput, handleKeyDown, handleBlur])

  useEffect(() => {
    const fetchItems = () => {
      if (!query) return
      const newItems = opt.onQuery(query)
      setItems(newItems)

      // Calculate coordinates after items are fetched
      const newCoords = getCaret()
      setCoords(newCoords)
    }

    const timeoutId = setTimeout(fetchItems, opt.debounce)
    return () => clearTimeout(timeoutId)
  }, [query, opt.onQuery, opt.debounce, getCaret, currentIndex])

  useEffect(() => {
    if (boxRef.current && coords) {
      const box = boxRef.current
      box.style.position = 'fixed'
      box.style.left = `${coords.x}px`
      box.style.top = `${coords.y}px`
      box.style.width = inputRef.current ? window.getComputedStyle(inputRef.current).width : 'auto'
      box.style.display = items.length > 0 ? 'block' : 'none'
    }
  }, [coords, items, inputRef])

  // TODO: Fix the display issue
  return (
    <div
      className="field-type textarea"
      style={{
        // display: items.length > 0 ? 'block' : 'none',
        // margin: items.length > 0 ? 'block' : 'none',
        position: 'relative',
      }}
    >
      <div className="textarea-outer" ref={shadowRef} style={{ position: 'absolute' }} />
      {items.length > 0 ? (
        <div className={styles.floatype} ref={boxRef}>
          {items.map((item, idx) => (
            <div
              className={`${styles.floatype_item} ${idx === currentIndex ? styles.floatype_sel : ''}`}
              data-selected={idx === currentIndex}
              key={idx}
              onMouseDown={() => {
                if (inputRef.current) {
                  const newVal = opt.onSelect
                    ? opt.onSelect(item, query)
                    : (item as unknown as string)
                  insertWord(inputRef.current, newVal)
                }
                destroy()
              }}
            >
              {opt.onRender ? opt.onRender(item) : (item as unknown as string)}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
