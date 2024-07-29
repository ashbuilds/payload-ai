'use client'

import type { LexicalEditor } from 'lexical'

import { useField, useFieldProps } from '@payloadcms/ui'
import React, { memo, useEffect, useMemo, useState } from 'react'

import type { BaseItemProps, MenuItems, UseMenuEvents } from '../../../types.js'

import {
  DocsAddOnIcon,
  EditNoteIcon,
  SegmentIcon,
  SpellCheckIcon,
  StylusNoteIcon,
  SummarizeIcon,
  TranslateIcon,
  TuneIcon,
} from '../Icons.js'
import styles from '../actions.module.scss'

const Item: React.FC<BaseItemProps> = memo(({ children, disabled, onClick = () => {} }) => (
  <span
    className={styles.generate_button}
    data-disabled={disabled}
    onClick={!disabled && onClick}
    onKeyDown={!disabled && onClick}
    role="presentation"
  >
    {children}
  </span>
))

const createMenuItem = (IconComponent, initialText) =>
  memo(({ children, disabled, hideIcon, onClick }: BaseItemProps) => (
    <Item disabled={disabled} onClick={onClick}>
      {hideIcon || <IconComponent size={18} />}
      {children || initialText}
    </Item>
  ))

const Proofread = createMenuItem(SpellCheckIcon, 'Proofread')
const Rephrase = createMenuItem(EditNoteIcon, 'Rephrase')
const Translate = createMenuItem(TranslateIcon, 'Translate')
const Expand = createMenuItem(DocsAddOnIcon, 'Expand')
const Summarize = createMenuItem(SummarizeIcon, 'Summarize')
const Simplify = createMenuItem(SegmentIcon, 'Simplify')
const Compose = createMenuItem(StylusNoteIcon, 'Compose')
const Settings = createMenuItem(TuneIcon, 'Settings')

type MenuItemsMapType = {
  component: React.FC<BaseItemProps>
  excludedFor?: string[]
  loadingText?: string
  name: MenuItems
}

const MenuItemsMap: MenuItemsMapType[] = [
  { name: 'Proofread', component: Proofread, excludedFor: ['upload'], loadingText: 'Proofreading' },
  { name: 'Rephrase', component: Rephrase, excludedFor: ['upload'], loadingText: 'Rephrasing' },
  { name: 'Translate', component: Translate, excludedFor: ['upload'], loadingText: 'Translating' },
  { name: 'Expand', component: Expand, excludedFor: ['upload', 'text'], loadingText: 'Expanding' },
  {
    name: 'Summarize',
    component: Summarize,
    excludedFor: ['upload', 'text'],
    loadingText: 'Summarizing',
  },
  { name: 'Simplify', component: Simplify, excludedFor: ['upload'], loadingText: 'Simplifying' },
  { name: 'Compose', component: Compose, loadingText: 'Composing' },
  { name: 'Settings', component: Settings },
]

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

type UseMenuProps = {
  lexicalEditor: LexicalEditor
}

export const useMenu = ({ lexicalEditor }: UseMenuProps, menuEvents: UseMenuEvents) => {
  const { type: fieldType, path: pathFromContext } = useFieldProps()
  const field = useField({ path: pathFromContext })
  const [activeComponent, setActiveComponent] = useState<MenuItems>('Rephrase')

  const { initialValue, value } = field

  useEffect(() => {
    if (!value) {
      setActiveComponent('Compose')
      return
    }

    if (MenuItemsMap.some((i) => i.excludedFor?.includes(fieldType))) {
      setActiveComponent('Compose')
      return
    }

    if (typeof value === 'string' && value !== initialValue) {
      setActiveComponent('Proofread')
    } else {
      setActiveComponent('Rephrase')
    }
  }, [initialValue, value, fieldType, lexicalEditor])

  const MemoizedActiveComponent = useMemo(() => {
    return ({ isLoading }) => {
      const ActiveComponent = getActiveComponent(activeComponent)
      const activeItem = MenuItemsMap.find((i) => i.name === activeComponent)
      return (
        <ActiveComponent disabled={isLoading} hideIcon onClick={menuEvents[`on${activeComponent}`]}>
          {isLoading && activeItem.loadingText}
        </ActiveComponent>
      )
    }
  }, [activeComponent, menuEvents])

  const filteredMenuItems = useMemo(
    () =>
      MenuItemsMap.filter((i) => i.name !== activeComponent && !i.excludedFor?.includes(fieldType)),
    [activeComponent, fieldType],
  )

  const MemoizedMenu = useMemo(() => {
    return ({ isLoading, onClose }) => (
      <div className={styles.menu}>
        {filteredMenuItems.map((i) => {
          const Item = i.component
          return (
            <Item
              disabled={isLoading}
              key={i.name}
              onClick={() => {
                if (i.name !== 'Settings') {
                  setActiveComponent(i.name)
                }

                menuEvents[`on${i.name}`]()
                onClose()
              }}
            >
              {isLoading && i.loadingText}
            </Item>
          )
        })}
      </div>
    )
  }, [filteredMenuItems, menuEvents])

  // Simply return the object without additional useMemo
  return {
    ActiveComponent: MemoizedActiveComponent,
    Menu: MemoizedMenu,
  }
}
