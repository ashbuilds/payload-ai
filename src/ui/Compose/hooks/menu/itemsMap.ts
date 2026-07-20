import type React from 'react'

import type { PluginAITranslationKeys } from '../../../../translations/index.js'
import type { ActionMenuItems, BaseItemProps } from '../../../../types.js'

import { Compose, Expand, Proofread, Rephrase, Settings, Simplify, Summarize } from './items.js'
import { MemoizedTranslateMenu } from './TranslateMenu.js'

type MenuItemsMapType = {
  component: React.FC<BaseItemProps>
  excludedFor?: string[]
  labelKey: PluginAITranslationKeys
  loadingKey?: PluginAITranslationKeys
  name: ActionMenuItems
}

export const menuItemsMap: MenuItemsMapType[] = [
  {
    name: 'Proofread',
    component: Proofread,
    excludedFor: ['upload'],
    labelKey: 'ai-plugin:proofread',
    loadingKey: 'ai-plugin:proofreading',
  },
  {
    name: 'Rephrase',
    component: Rephrase,
    excludedFor: ['upload'],
    labelKey: 'ai-plugin:rephrase',
    loadingKey: 'ai-plugin:rephrasing',
  },
  {
    name: 'Translate',
    component: MemoizedTranslateMenu,
    excludedFor: ['upload'],
    labelKey: 'ai-plugin:translate',
    loadingKey: 'ai-plugin:translating',
  },
  {
    name: 'Expand',
    component: Expand,
    excludedFor: ['upload', 'text'],
    labelKey: 'ai-plugin:expand',
    loadingKey: 'ai-plugin:expanding',
  },
  {
    // Turned off - WIP
    name: 'Summarize',
    component: Summarize,
    excludedFor: ['upload', 'text', 'richText'],
    labelKey: 'ai-plugin:summarize',
    loadingKey: 'ai-plugin:summarizing',
  },
  {
    name: 'Simplify',
    component: Simplify,
    excludedFor: ['upload'],
    labelKey: 'ai-plugin:simplify',
    loadingKey: 'ai-plugin:simplifying',
  },
  {
    name: 'Compose',
    component: Compose,
    labelKey: 'ai-plugin:compose',
    loadingKey: 'ai-plugin:composing',
  },
  { name: 'Settings', component: Settings, labelKey: 'ai-plugin:settings' },
]
