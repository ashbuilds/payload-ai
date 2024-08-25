import React, { useState } from 'react'
import locales from 'locale-codes'

import { Translate } from './items.js'
import { Item } from './Item.js'
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
        onClick={() => {
          setShow(!show)
        }}
        onMouseEnter={() => setShow(true)}
        isMenu={true}
        isActive={show}
      ></Translate>
      <div className={styles.hoverMenu} data-show={show}>
        <div className={`${styles.menu} ${styles.subMenu}`}>
          <Item
            onClick={() => {}}
            style={{
              position: 'sticky',
              top: 0,
              padding: '0 0 5px 0',
              background: 'transparent',
            }}
          >
            <input
              className={styles.menuInput}
              placeholder={'Search...'}
              onFocus={() => setInputFocus(true)}
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
