'use client'

import { useField } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

import type { ActionMenuItems, UseMenuEvents } from '../../../../types.js'

import { useFieldProps } from '../../../../providers/FieldProvider/useFieldProps.js'
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
    return ({ isLoading, stop }) => {
      const ActiveComponent = getActiveComponent(activeComponent)
      const activeItem = menuItemsMap.find((i) => i.name === activeComponent)
      return (
        <ActiveComponent
          hideIcon
          onClick={(data) => {
            if (!isLoading) {
              const trigger = menuEvents[`on${activeComponent}`]
              if (typeof trigger === 'function') {
                trigger(data)
              } else {
                console.error('No trigger found for', activeComponent)
              }
            } else {
              stop()
            }
          }}
          title={isLoading ? 'Click to stop' : activeItem.name}
        >
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
