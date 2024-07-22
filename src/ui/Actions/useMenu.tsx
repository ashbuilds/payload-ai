'use client'

import { Popup, useField, useFieldProps } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

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

type MenuItems =
  | 'Compose'
  | 'Expand'
  | 'Proofread'
  | 'Rephrase'
  | 'Settings'
  | 'Simplify'
  | 'Summarize'
  | 'Tone'
  | 'Translate'

type MenuEvents =
  | 'onCompose'
  | 'onExpand'
  | 'onProofread'
  | 'onRephrase'
  | 'onSettings'
  | 'onSimplify'
  | 'onSummarize'
  | 'onTone'
  | 'onTranslate'

type UseMenuProps = {
  [key in MenuEvents]?: () => void
}

type BaseItemProps = {
  hideIcon?: boolean
  onClick: () => void
}

const Item: React.FC<{ children: React.ReactNode; onClick?: () => void }> = (
  { children, onClick } = { children: null, onClick: () => {} },
) => (
  <span
    className={styles.generate_button}
    onClick={onClick}
    onKeyDown={onClick}
    role="presentation"
  >
    {children}
  </span>
)

const Proofread = ({ hideIcon, onClick }: BaseItemProps) => (
  <Item onClick={onClick}>
    {hideIcon || <SpellCheckIcon size={18} />}
    Proofread
  </Item>
)

const Rephrase = ({ hideIcon, onClick }: BaseItemProps) => (
  <Item onClick={onClick}>
    {hideIcon || <EditNoteIcon />}
    Rephrase
  </Item>
)

const Translate = ({ hideIcon, onClick }: BaseItemProps) => (
  <Item onClick={onClick}>
    {hideIcon || <TranslateIcon size={18} />}
    Translate
  </Item>
)

const Expand = ({ hideIcon, onClick }: BaseItemProps) => (
  <Item onClick={onClick}>
    {hideIcon || <DocsAddOnIcon size={18} />}
    Expand
  </Item>
)

const Summarize = ({ hideIcon, onClick }: BaseItemProps) => (
  <Item onClick={onClick}>
    {hideIcon || <SummarizeIcon size={18} />}
    Summarize
  </Item>
)

// const Tone = ({ onClick }) => <Item onClick={onClick}>Tone</Item>

const Simplify = ({ hideIcon, onClick }: BaseItemProps) => (
  <Item onClick={onClick}>
    {hideIcon || <SegmentIcon size={18} />}
    Simplify
  </Item>
)

const Compose = ({ hideIcon, onClick }: BaseItemProps) => (
  <Item onClick={onClick}>
    {hideIcon || <StylusNoteIcon size={18} />}
    Compose
  </Item>
)

const Settings = ({ hideIcon, onClick }: BaseItemProps) => (
  <Item onClick={onClick}>
    {hideIcon || <TuneIcon size={18} />}
    Settings
  </Item>
)

export const useMenu = (menuEvents: UseMenuProps) => {
  const { type: fieldType, path: pathFromContext } = useFieldProps()
  const field = useField({
    path: pathFromContext,
  })

  const MenuItemsMap = [
    { name: 'Proofread', component: Proofread, excludedFor: ['upload'] },
    { name: 'Rephrase', component: Rephrase, excludedFor: ['upload'] },
    { name: 'Translate', component: Translate, excludedFor: ['upload'] },
    { name: 'Expand', component: Expand, excludedFor: ['upload'] },
    { name: 'Summarize', component: Summarize, excludedFor: ['upload'] },
    // { name: 'Tone', component: Tone },
    { name: 'Simplify', component: Simplify, excludedFor: ['upload'] },
    { name: 'Compose', component: Compose },
    { name: 'Settings', component: Settings },
  ]

  const [activeComponent, setActiveComponent] = useState<MenuItems>('Rephrase')

  const { initialValue, value } = field
  // Suggest the active component based on the current content of the field
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
      return
    }
  }, [initialValue, value, fieldType])

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

  return {
    ActiveComponent: () => {
      const ActiveComponent = getActiveComponent(activeComponent)
      const handler = menuEvents[`on${activeComponent}`] || (() => {})
      return <ActiveComponent hideIcon onClick={handler} />
    },
    Menu: ({ button }) => (
      <Popup button={button}>
        <div className={styles.menu}>
          {MenuItemsMap.filter(
            (i) => i.name !== activeComponent && !i.excludedFor?.includes(fieldType),
          ).map((i) => {
            const Item = i.component
            const handler = menuEvents[`on${i.name}`] || (() => {})

            return <Item onClick={handler} />
          })}
        </div>
      </Popup>
    ),
  }
}
