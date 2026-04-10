import { useLocale } from '@payloadcms/ui'
import locales from 'locale-codes'
import React, { memo, useState } from 'react'

import { useInstructions } from '../../../../providers/InstructionsProvider/useInstructions.js'
import { Item } from './Item.js'
import { Translate } from './items.js'
import styles from './menu.module.scss'

export const TranslateMenu = ({ onClick }: { onClick: (data: { locale: string }) => void }) => {
  const [show, setShow] = useState(false)

  const { enabledLanguages = [] } = useInstructions()
  const currentLocale = useLocale()
  const currentLocaleCode = currentLocale?.code

  let filteredLocales = locales.all.filter((a) => {
    return a.tag && a.location
  })

  if (enabledLanguages?.length) {
    filteredLocales = filteredLocales.filter((a) => enabledLanguages?.includes(a.tag))
  }

  const [languages, setLanguages] = useState(filteredLocales)
  const [inputFocus, setInputFocus] = useState(false)

  return (
    <div
      className={styles.menu}
      onMouseLeave={() => {
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
          }}
        >
          {currentLocaleCode && (
            <Item
              onClick={() => {
                onClick({ locale: currentLocaleCode })
              }}
              style={{                
                marginBottom: '4px',
                marginTop: "4px",
                paddingBottom: '4px',
              }}
            >
              <span className={styles.ellipsis}>
                {`Current(${currentLocaleCode})`}
              </span>
            </Item>
          )}
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
              className={styles.menuInput}
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
