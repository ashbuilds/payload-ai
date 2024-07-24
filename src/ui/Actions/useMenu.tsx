'use client'

import React, { useEffect, useState, memo, useMemo } from 'react'
import { useField, useFieldProps } from '@payloadcms/ui'
import { LexicalEditor } from 'lexical'

import styles from './actions.module.scss'
import {
  DocsAddOnIcon,
  EditNoteIcon,
  SegmentIcon,
  SpellCheckIcon,
  StylusNoteIcon,
  SummarizeIcon,
  TranslateIcon,
  TuneIcon,
} from './icons.js'
import { BaseItemProps, MenuItems, UseMenuEvents } from '../../types.js'

const Item: React.FC<BaseItemProps> = memo(({ children, onClick = () => {} }) => (
  <span
    className={styles.generate_button}
    onClick={onClick}
    onKeyDown={onClick}
    role="presentation"
  >
    {children}
  </span>
))

const createMenuItem = (IconComponent, text) =>
  memo(({ hideIcon, onClick }: BaseItemProps) => (
    <Item onClick={onClick}>
      {hideIcon || <IconComponent size={18} />}
      {text}
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

const MenuItemsMap = [
  { name: 'Proofread', component: Proofread, excludedFor: ['upload'] },
  { name: 'Rephrase', component: Rephrase, excludedFor: ['upload'] },
  { name: 'Translate', component: Translate, excludedFor: ['upload'] },
  { name: 'Expand', component: Expand, excludedFor: ['upload', 'text'] },
  { name: 'Summarize', component: Summarize, excludedFor: ['upload', 'text'] },
  { name: 'Simplify', component: Simplify, excludedFor: ['upload'] },
  { name: 'Compose', component: Compose },
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
    return ({ disabled = false }) => {
      const ActiveComponent = getActiveComponent(activeComponent)
      return <ActiveComponent hideIcon onClick={menuEvents[`on${activeComponent}`]} />
    }
  }, [activeComponent, menuEvents])

  const filteredMenuItems = useMemo(
    () =>
      MenuItemsMap.filter((i) => i.name !== activeComponent && !i.excludedFor?.includes(fieldType)),
    [activeComponent, fieldType],
  )

  const MemoizedMenu = useMemo(() => {
    return ({ disabled = false, onClose }) => (
      <div className={styles.menu}>
        {filteredMenuItems.map((i) => {
          const Item = i.component
          return (
            <Item
              key={i.name}
              onClick={() => {
                menuEvents[`on${i.name}`]()
                onClose()
              }}
            />
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
