'use client'

import { useForm } from '@payloadcms/ui'
import { getSiblingData } from 'payload/shared'
import React, { useEffect, useMemo, useState } from 'react'

import type { ActionMenuItems, UseMenuEvents, UseMenuOptions } from '../../../../types.js'

import { useFieldProps } from '../../../../providers/FieldProvider/useFieldProps.js'
import { Compose, Proofread, Rephrase } from './items.js'
import { menuItemsMap } from './itemsMap.js'
import styles from './menu.module.scss'

const getActiveComponent = (ac: ActionMenuItems) => {
  switch (ac) {
    case 'Compose':
      return Compose
    case 'Proofread':
      return Proofread
    case 'Rephrase':
      return Rephrase
    default:
      return Rephrase
  }
}

export const useMenu = (menuEvents: UseMenuEvents, options: UseMenuOptions) => {
  const { field: { type: fieldType } = {}, path } = useFieldProps()
  const { getData } = useForm()
  const [activeComponent, setActiveComponent] = useState<ActionMenuItems>('Rephrase')

  // Check value once on mount or when path/type changes
  useEffect(() => {
    let hasValue = false

    try {
      const data = getData()
      if (path) {
        const val = getSiblingData(data, path)
        hasValue = val !== undefined && val !== null
        // For richTextFields, we might need a more robust check (e.g. check for root.children.length > 0)
        // But for now, simple truthiness covers most cases or at least defaults safely
        if (fieldType === 'richText' && val && typeof val === 'object' && 'root' in val) {
           // Basic lexical check could go here if needed
        }
      }
    } catch (e) {
      // ignore
    }

    if (!hasValue) {
      setActiveComponent('Compose')
      return
    }

    if (menuItemsMap.some((i) => i.excludedFor?.includes(fieldType ?? ''))) {
      setActiveComponent('Compose')
      return
    }

    // Default to Rephrase if value exists
    setActiveComponent('Rephrase')
  }, [fieldType, getData, path])

  const MemoizedActiveComponent = useMemo(() => {
    return ({ isLoading, loadingLabel, stop }: { isLoading: boolean; loadingLabel?: string; stop: () => void }) => {
      const ActiveComponent = getActiveComponent(activeComponent)
      const activeItem = menuItemsMap.find((i) => i.name === activeComponent)!
      return (
        <ActiveComponent
          hideIcon
          onClick={(data: unknown) => {
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
          {isLoading && (loadingLabel ?? activeItem.loadingText)}
        </ActiveComponent>
      )
    }
  }, [activeComponent, menuEvents])

  const filteredMenuItems = useMemo(
    () =>
      menuItemsMap.filter((i) => {
        if (i.name === 'Settings' && !options.isConfigAllowed) {
          return false
        } // Disable settings if a user role is not permitted
        return i.name !== activeComponent && !i.excludedFor?.includes(fieldType ?? '')
      }),
    [activeComponent, fieldType, options.isConfigAllowed],
  )

  const MemoizedMenu = useMemo(() => {
    return ({ isLoading, onClose }: { isLoading: boolean; onClose: () => void }) => (
      <div className={styles.menu}>
        {filteredMenuItems.map((i) => {
          const Action = i.component
          return (
            <Action
              disabled={isLoading}
              key={i.name}
              onClick={(data: unknown) => {
                if (i.name !== 'Settings') {
                  setActiveComponent(i.name)
                }

                menuEvents[`on${i.name}`]?.(data)
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

