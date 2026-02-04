import type React from 'react'

import type { ActionMenuItems, BaseItemProps } from '../../../../types.js'

import { Compose, Expand, Proofread, Rephrase, Settings, Simplify, Summarize } from './items.js'
import { MemoizedTranslateMenu, TranslateMenu } from './TranslateMenu.js'

type MenuItemsMapType = {
  component: React.FC<BaseItemProps>
  excludedFor?: string[]
  loadingText?: string
  name: ActionMenuItems
}

export const menuItemsMap: MenuItemsMapType[] = [
  { name: 'Proofread', component: Proofread, excludedFor: ['upload', 'array'], loadingText: 'Proofreading' },
  { name: 'Rephrase', component: Rephrase, excludedFor: ['upload', 'array'], loadingText: 'Rephrasing' },
  {
    name: 'Translate',
    component: MemoizedTranslateMenu,
    excludedFor: ['upload', 'array'],
    loadingText: 'Translating',
  },
  { name: 'Expand', component: Expand, excludedFor: ['upload', 'text', 'array'], loadingText: 'Expanding' },
  {
    // Turned off - WIP
    name: 'Summarize',
    component: Summarize,
    excludedFor: ['upload', 'text', 'richText', 'array'],
    loadingText: 'Summarizing',
  },
  { name: 'Simplify', component: Simplify, excludedFor: ['upload', 'array'], loadingText: 'Simplifying' },
  { name: 'Compose', component: Compose, loadingText: 'Composing' },
  { name: 'Settings', component: Settings },
]
