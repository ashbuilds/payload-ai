'use client'

import { useConfig, useField, useLocale, useTranslation } from '@payloadcms/ui'
import React, { useEffect, useMemo, useState } from 'react'

import type {
  PluginAITranslationKeys,
  PluginAITranslations,
} from '../../../../translations/index.js'
import type { ActionMenuItems } from '../../../../types.js'
import type { UseMenuEvents, UseMenuOptions } from './types.js'

import { useFieldProps } from '../../../../providers/FieldProvider/useFieldProps.js'
import { Compose, Proofread, Rephrase, Translate } from './items.js'
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
    case 'Translate':
      return Translate
    default:
      return Rephrase
  }
}

export const useMenu = (menuEvents: UseMenuEvents, options: UseMenuOptions) => {
  const { field: { type: fieldType } = {}, path } = useFieldProps()
  const { value } = useField<any>({ path: path || '' })
  const { config } = useConfig()
  const locale = useLocale()
  const { t } = useTranslation<PluginAITranslations, PluginAITranslationKeys>()
  const [activeComponent, setActiveComponent] = useState<ActionMenuItems>('Rephrase')

  // Check value whenever it changes
  useEffect(() => {
    let hasValue = false

    try {
      hasValue = value !== undefined && value !== null
      // For richTextFields, we might need a more robust check (e.g. check for root.children.length > 0)
      // But for now, simple truthiness covers most cases or at least defaults safely
      if (fieldType === 'richText' && value && typeof value === 'object' && 'root' in value) {
        // Basic lexical check could go here if needed
      }
    } catch (e) {
      // ignore
    }

    if (!hasValue) {
      const defaultLocale = config?.localization ? config.localization.defaultLocale : undefined
      if (locale?.code && defaultLocale && locale.code !== defaultLocale) {
        setActiveComponent('Translate')
      } else {
        setActiveComponent('Compose')
      }
      return
    }

    if (menuItemsMap.some((i) => i.excludedFor?.includes(fieldType ?? ''))) {
      setActiveComponent('Compose')
      return
    }

    // Default to Rephrase if value exists
    setActiveComponent('Rephrase')
  }, [fieldType, value, locale?.code, config?.localization])

  const MemoizedActiveComponent = useMemo(() => {
    return ({
      isLoading,
      loadingLabel,
      stop,
    }: {
      isLoading: boolean
      loadingLabel?: string
      stop: () => void
    }) => {
      const ActiveComponent = getActiveComponent(activeComponent)
      const activeItem = menuItemsMap.find((i) => i.name === activeComponent)!
      return (
        <ActiveComponent
          hideIcon
          onClick={(data: unknown) => {
            if (!isLoading) {
              const trigger = menuEvents[`on${activeComponent}`]
              if (typeof trigger === 'function') {
                const isEvent = data && typeof data === 'object' && 'nativeEvent' in data
                const actualData = isEvent ? undefined : data

                if (activeComponent === 'Translate' && !actualData) {
                  trigger({ locale: locale?.code, translateFromDefault: true })
                } else {
                  trigger(actualData)
                }
              } else {
                console.error('No trigger found for', activeComponent)
              }
            } else {
              stop()
            }
          }}
          title={
            isLoading
              ? t('ai-plugin:general:clickToStop' as any)
              : t(`ai-plugin:actions:${activeItem.name.toLowerCase()}` as any)
          }
        >
          {isLoading &&
            (loadingLabel ??
              t(`ai-plugin:actionLoading:${activeItem.name.toLowerCase()}:ing` as any))}
        </ActiveComponent>
      )
    }
  }, [activeComponent, menuEvents, t, locale?.code])

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
