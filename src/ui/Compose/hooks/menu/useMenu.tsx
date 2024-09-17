'use client'

import { useField, useFieldProps } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

import type { ActionMenuItems, UseMenuEvents } from '../../../../types.js'

import { Compose, Proofread, Rephrase } from './items.js'
import { menuItemsMap } from './itemsMap.js'
import styles from './menu.module.scss'

const getActiveComponent = (ac) => {
  switch (ac) {
    case 'Proofread':
      return Proofread
    case 'Rephrase':
      return Rephrase
    case 'Compose':
      return Compose
    default:
      return Rephrase
  }
}

export const useMenu = (menuEvents: UseMenuEvents) => {
  const { type: fieldType, path: pathFromContext } = useFieldProps()
  const field = useField({ path: pathFromContext })
  const [activeComponent, setActiveComponent] = useState<ActionMenuItems>('Rephrase')

  const { initialValue, value } = field

  useEffect(() => {
    if (!value) {
      setActiveComponent('Compose')
      return
    }

    if (menuItemsMap.some((i) => i.excludedFor?.includes(fieldType))) {
      setActiveComponent('Compose')
      return
    }

    if (typeof value === 'string' && value !== initialValue) {
      setActiveComponent('Proofread')
    } else {
      setActiveComponent('Rephrase')
    }
  }, [initialValue, value, fieldType])

  const MemoizedActiveComponent = useMemo(() => {
    return ({ isLoading }) => {
      const ActiveComponent = getActiveComponent(activeComponent)
      const activeItem = menuItemsMap.find((i) => i.name === activeComponent)
      return (
        <ActiveComponent disabled={isLoading} hideIcon onClick={menuEvents[`on${activeComponent}`]}>
          {isLoading && activeItem.loadingText}
        </ActiveComponent>
      )
    }
  }, [activeComponent, menuEvents])

  const filteredMenuItems = useMemo(
    () =>
      menuItemsMap.filter((i) => i.name !== activeComponent && !i.excludedFor?.includes(fieldType)),
    [activeComponent, fieldType],
  )

  const MemoizedMenu = useMemo(() => {
    return ({ isLoading, onClose }) => (
      <div className={styles.menu}>
        {filteredMenuItems.map((i) => {
          const Action = i.component
          return (
            <Action
              disabled={isLoading}
              key={i.name}
              onClick={(data) => {
                if (i.name !== 'Settings') {
                  setActiveComponent(i.name)
                }

                menuEvents[`on${i.name}`](data)
                onClose()
              }}
            >
              {isLoading && i.loadingText}
            </Action>
          )
        })}
      </div>
    )
  }, [filteredMenuItems, menuEvents])

  return {
    ActiveComponent: MemoizedActiveComponent,
    Menu: MemoizedMenu,
  }
}
