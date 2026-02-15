import locales from 'locale-codes'
import React, { memo, useEffect, useState } from 'react'

import { useInstructions } from '../../../../providers/InstructionsProvider/useInstructions.js'
import { Item } from './Item.js'
import { Translate } from './items.js'
import styles from './menu.module.scss'

declare global {
  interface Window {
    __AI_MENU_INTERACTIVE?: boolean
  }
}

export const TranslateMenu = ({ onClick }: { onClick: (data: { locale: string }) => void }) => {
  const [show, setShow] = useState(false)

  const { enabledLanguages = [] } = useInstructions()

  let filteredLocales = locales.all.filter((a) => {
    return a.tag && a.location
  })

  if (enabledLanguages?.length) {
    filteredLocales = filteredLocales.filter((a) => enabledLanguages?.includes(a.tag))
  }

  const [languages, setLanguages] = useState(filteredLocales)
  const [inputFocus, setInputFocus] = useState(false)

  // Cleanup global flag when menu unmounts or closes
  useEffect(() => {
    if (!show) {
      if (typeof window !== 'undefined') {
        window.__AI_MENU_INTERACTIVE = false
      }
    }
    return () => {
      if (show && typeof window !== 'undefined') {
        window.__AI_MENU_INTERACTIVE = false
      }
    }
  }, [show])

  return (
    <div
      className={`${styles.menu} ai-interactive-menu`}
      data-ai-interactive="true"
      onBlur={(e) => {
        // Only clear if focus moves outside the menu container
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          if (typeof window !== 'undefined') window.__AI_MENU_INTERACTIVE = false
        }
      }}
      onFocus={() => {
        if (typeof window !== 'undefined') window.__AI_MENU_INTERACTIVE = true
      }}
      onMouseEnter={() => {
        if (typeof window !== 'undefined') window.__AI_MENU_INTERACTIVE = true
      }}
      onMouseLeave={() => {
        if (typeof window !== 'undefined') window.__AI_MENU_INTERACTIVE = false
        if (!inputFocus) {
          setShow(false)
        }
      }}
    >
      <Translate
        isActive={show}
        isMenu
        onClick={() => {
          setShow(!show)
        }}
      />
      <div className={styles.hoverMenu} data-show={show}>
        <div
          className={`${styles.menu} ${styles.subMenu}`}
          style={{
            background: 'var(--popup-bg)',
            // minHeight: '300px',
          }}
        >
          <Item
            onClick={() => {}}
            style={{
              background: 'transparent',
              padding: '0 0 5px 0',
              position: 'sticky',
              top: 0,
            }}
          >
            <input
              className={`${styles.menuInput} ai-interactive-menu`}
              data-ai-interactive="true"
              onBlur={() => setInputFocus(false)}
              onChange={(event) => {
                const value = event.target.value
                setLanguages(
                  filteredLocales.filter((l) => {
                    const lowerCaseValue = value.toLowerCase()
                    return (
                      l.name.toLowerCase().startsWith(lowerCaseValue) ||
                      (l.location && l.location.toLowerCase().startsWith(lowerCaseValue)) ||
                      l.tag.toLowerCase().startsWith(lowerCaseValue)
                    )
                  }),
                )
              }}
              onFocus={() => setInputFocus(true)}
              placeholder="Search..."
            />
          </Item>
          {languages.map((locale) => {
            return (
              <Item
                className="ai-interactive-menu"
                data-ai-interactive="true"
                key={locale.tag}
                onClick={() => {
                  onClick({ locale: locale.tag })
                }}
              >
                <span className={styles.ellipsis}>{`${locale.location} (${locale.tag})`}</span>
              </Item>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export const MemoizedTranslateMenu = memo(TranslateMenu)
