import locales from 'locale-codes'
import React, { useState } from 'react'

import { Item } from './Item.js'
import { Translate } from './items.js'
import styles from './menu.module.scss'

export const TranslateMenu = ({ onClick }) => {
  const [show, setShow] = useState(false)

  const filteredLocales = locales.all.filter((a) => {
    return a.tag && a.location
  })

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
        onMouseEnter={() => setShow(true)}
       />
      <div className={styles.hoverMenu} data-show={show}>
        <div className={`${styles.menu} ${styles.subMenu}`}>
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
                      l.location.toLowerCase().startsWith(lowerCaseValue) ||
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
