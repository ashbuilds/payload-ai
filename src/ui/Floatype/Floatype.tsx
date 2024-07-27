/**
 * OG Creator: Kailash Nadh
 * Github: https://github.com/knadh/floatype.js
 *
 * Reacted By: Claude 3.5 Sonnet and Ashbuilds
 */

import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react'

import styles from './floatype.module.scss'

type Options = {
  debounce?: number
  onNavigate?: (direction: number, items: any[], currentIndex: number) => void
  onQuery: (query: string) => any[]
  onRender?: (item: any) => React.ReactNode
  onSelect?: (item: any, query: string) => string
  onUpdate: (value: string) => void
}

type FloatypeProps = {
  options: Partial<Options>
}

export const Floatype = forwardRef<HTMLTextAreaElement, FloatypeProps>(({ options }, inputRef) => {
  const [items, setItems] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [query, setQuery] = useState<null | string>(null)
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null)

  const boxRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)

  const opt: Options = {
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

  const getLastWord = useCallback((el: HTMLTextAreaElement): null | string => {
    const text = el.value.substring(0, el.selectionStart ?? 0)
    const match = text.match(/\S+\s*$/)
    return match ? match[0] : null
  }, [])

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

  const getCaret = useCallback(() => {
    if (!inputRef || !('current' in inputRef) || !inputRef.current || !shadowRef.current)
      return null

    const el = inputRef.current
    const shadow = shadowRef.current

    const txt = el.value.substring(0, el.selectionStart ?? 0)
    const start = Math.max(txt.lastIndexOf('\n'), txt.lastIndexOf(' ')) + 1

    const cl = 'floatype-caret'
    shadow.innerHTML =
      el.value.substring(0, start) +
      `<span id="${cl}" style="display: inline-block;">${el.value.substring(start)}</span>`

    const m = shadow.querySelector(`#${cl}`)
    const elRect = el.getBoundingClientRect()
    const mRect = m?.getBoundingClientRect()

    if (!mRect) return null

    let top = mRect.top - elRect.top + el.scrollTop
    let left = mRect.left - elRect.left + el.scrollLeft

    if (boxRef.current && currentIndex !== null) {
      const box = boxRef.current
      const selected = box.children[currentIndex] as HTMLElement
      if (selected) {
        top -= selected.offsetTop + (selected.clientHeight / 2 - 5)
      }
    }

    if (boxRef.current) {
      const box = boxRef.current
      if (box.clientWidth + left + elRect.left + 50 > window.innerWidth) {
        left = left - box.offsetWidth - 50
      }
    }

    return {
      x: left + elRect.left,
      y: top + elRect.top,
    }
  }, [inputRef, shadowRef, boxRef, currentIndex])

  const handleInput = useCallback(() => {
    if (!inputRef || !('current' in inputRef) || !inputRef.current) return
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

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
          break
        case 'ArrowDown':
          e.preventDefault()
          setCurrentIndex((prev) => (prev + 1) % items.length)
          break
        case 'Enter':
          e.preventDefault()
          if (inputRef && 'current' in inputRef && inputRef.current) {
            const selectedItem = items[currentIndex]
            const newVal = opt.onSelect
              ? opt.onSelect(selectedItem, query)
              : (selectedItem as unknown as string)
            insertWord(inputRef.current, newVal)
          }
          destroy()
          break
        case 'Escape':
          destroy()
          break
      }
    },
    [boxRef, items, currentIndex, inputRef, opt.onSelect, insertWord, destroy, query],
  )

  useEffect(() => {
    if (!inputRef || !('current' in inputRef) || !inputRef.current) return

    const el = inputRef.current
    el.addEventListener('input', handleInput)
    el.addEventListener('keydown', handleKeyDown as any)
    el.addEventListener('blur', destroy)

    return () => {
      el.removeEventListener('input', handleInput)
      el.removeEventListener('keydown', handleKeyDown as any)
      el.removeEventListener('blur', destroy)
    }
  }, [inputRef, handleInput, handleKeyDown])

  useEffect(() => {
    if (!shadowRef.current || !inputRef || !('current' in inputRef) || !inputRef.current) return

    const shadow = shadowRef.current
    const el = inputRef.current

    const stylesCss = window.getComputedStyle(el)
    const { fontFamily, fontSize, fontWeight } = stylesCss

    shadow.style.fontFamily = fontFamily
    shadow.style.fontSize = fontSize
    shadow.style.fontWeight = fontWeight

    const updateShadowPosition = () => {
      const elRect = el.getBoundingClientRect()
      shadow.style.position = 'fixed'
      shadow.style.top = `${elRect.top}px`
      shadow.style.left = `${elRect.left - 52}px`
      shadow.style.width = `${elRect.width}px`
      shadow.style.height = `${elRect.height}px`
      shadow.style.opacity = '0'
      shadow.style.padding = '0'
      shadow.style.visibility = 'hidden'
    }

    setTimeout(updateShadowPosition, 300)
    window.addEventListener('resize', updateShadowPosition)
    window.addEventListener('scroll', updateShadowPosition)

    return () => {
      window.removeEventListener('resize', updateShadowPosition)
      window.removeEventListener('scroll', updateShadowPosition)
    }
  }, [inputRef, shadowRef])

  useEffect(() => {
    const fetchItems = () => {
      if (!query) return
      const newItems = opt.onQuery(query)
      setItems(newItems)
      setCoords(getCaret())
    }

    const timeoutId = setTimeout(fetchItems, opt.debounce)
    return () => clearTimeout(timeoutId)
  }, [query, opt.onQuery, opt.debounce, getCaret])

  useEffect(() => {
    if (opt.onNavigate) {
      opt.onNavigate(1, items, currentIndex)
    }
  }, [currentIndex, items, opt])

  useEffect(() => {
    if (boxRef.current && coords && inputRef && 'current' in inputRef && inputRef.current) {
      const box = boxRef.current
      box.style.position = 'fixed'
      box.style.left = `${coords.x}px`
      box.style.top = `${coords.y}px`
      box.style.width = window.getComputedStyle(inputRef.current).width
      box.style.display = items.length > 0 ? 'block' : 'none'
    }
  }, [coords, items, inputRef])

  return (
    <div className="field-type textarea" style={{ position: 'relative' }}>
      <div className="textarea-clone" ref={shadowRef} style={{ position: 'absolute' }} />
      {items.length > 0 && (
        <div className={styles.floatype} ref={boxRef}>
          {items.map((item, idx) => (
            <div
              className={`${styles.floatype_item} ${idx === currentIndex ? styles.floatype_sel : ''}`}
              data-selected={idx === currentIndex}
              key={idx}
              onMouseDown={() => {
                if (inputRef && 'current' in inputRef && inputRef.current) {
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
      )}
    </div>
  )
})
