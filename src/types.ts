import type { Collection, Endpoint, Field, GroupField } from 'payload'
import type { CSSProperties, MouseEventHandler } from 'react'

import type { LexicalBaseNode } from './ai/schemas/lexical.schema.js'

export interface PluginConfig {
  collections: {
    [key: string]: boolean
  }
  debugging?: boolean
  editorConfig?: { nodes: (typeof LexicalBaseNode)[] }
  fields?: Field[]
  generatePromptOnInit?: boolean
  globals?: string[]
  interfaceName?: string
}

export interface GenerationModel {
  fields: string[]
  handler?: (payload: any, options: any) => Promise<any>
  id: string
  name: string
  output: 'audio' | 'file' | 'image' | 'json' | 'text' | 'video'
  settings?: GroupField
  supportsPromptOptimization?: boolean
}

export interface GenerationConfig {
  models: GenerationModel[]
  provider: string
}

export type GenerateTextarea<T = any> = (args: {
  doc: T
  locale?: string
  options?: any
}) => Promise<string> | string

export interface Instructions {
  'collection-slug': string
  id: string
  'model-id': string
  prompt: string
}

export interface Endpoints {
  textarea: Omit<Endpoint, 'root'>
  upload: Omit<Endpoint, 'root'>
}

export type ActionMenuItems =
  | 'Compose'
  | 'Expand'
  | 'Proofread'
  | 'Rephrase'
  | 'Settings'
  | 'Simplify'
  | 'Summarize'
  | 'Tone'
  | 'Translate'

export type ActionMenuEvents =
  | 'onCompose'
  | 'onExpand'
  | 'onProofread'
  | 'onRephrase'
  | 'onSettings'
  | 'onSimplify'
  | 'onSummarize'
  | 'onTone'
  | 'onTranslate'

export type UseMenuEvents = {
  [key in ActionMenuEvents]?: (data?: unknown) => void
}

export type BaseItemProps<T = any> = {
  children?: React.ReactNode
  disabled?: boolean
  hideIcon?: boolean
  isActive?: boolean
  isMenu?: boolean
  onClick: (data?: unknown) => void
  onMouseEnter?: MouseEventHandler<T> | undefined
  onMouseLeave?: MouseEventHandler<T> | undefined
  style?: CSSProperties | undefined
}

/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "plugin-ai-instructions".
 */
export interface PluginAiInstruction {
  createdAt: string
  'dalle-e-settings'?: {
    'enable-prompt-optimization'?: boolean | null
    size?: ('256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024') | null
    style?: ('natural' | 'vivid') | null
    version?: ('dall-e-2' | 'dall-e-3') | null
  }
  'field-type'?: ('richText' | 'text' | 'textarea' | 'upload') | null
  id: string
  'model-id'?: ('dall-e' | 'openai-gpt-object' | 'openai-gpt-text' | 'tts') | null
  'openai-gpt-object-settings'?: {
    layout?: null | string
    model?: ('gpt-4-turbo' | 'gpt-4o' | 'gpt-4o-2024-08-06' | 'gpt-4o-mini') | null
    system?: null | string
  }
  'openai-gpt-text-settings'?: {
    model?: ('gpt-3.5-turbo' | 'gpt-4-turbo' | 'gpt-4o' | 'gpt-4o-mini') | null
  }
  'openai-tts-settings'?: {
    model?: ('tts-1' | 'tts-1-hd') | null
    response_format?: ('aac' | 'flac' | 'mp3' | 'opus' | 'pcm' | 'wav') | null
    speed?: null | number
    voice?: ('alloy' | 'echo' | 'fable' | 'nova' | 'onyx' | 'shimmer') | null
  }
  prompt?: null | string
  'schema-path'?: null | string
  updatedAt: string
}
