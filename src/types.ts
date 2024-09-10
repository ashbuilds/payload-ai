import type { Collection, Endpoint, Field, GroupField } from 'payload'
import { CSSProperties, MouseEventHandler } from 'react'
import { LexicalBaseNode } from './ai/schemas/lexical.schema.js'

export interface PluginConfig {
  collections: {
    [key: string]: boolean
  }
  fields?: Field[]
  globals?: string[]
  interfaceName?: string
  editorConfig?: { nodes: (typeof LexicalBaseNode)[] }
  debugging?: boolean
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
  onClick: (data?: unknown) => void
  onMouseEnter?: MouseEventHandler<T> | undefined
  onMouseLeave?: MouseEventHandler<T> | undefined
  style?: CSSProperties | undefined
  isMenu?: boolean
  isActive?: boolean
}

/**
 * This interface was referenced by `Config`'s JSON-Schema
 * via the `definition` "plugin-ai-instructions".
 */
export interface PluginAiInstruction {
  id: string
  'schema-path'?: string | null
  'field-type'?: ('text' | 'textarea' | 'upload' | 'richText') | null
  'model-id'?: ('openai-gpt-text' | 'dall-e' | 'tts' | 'openai-gpt-object') | null
  prompt?: string | null
  'openai-gpt-text-settings'?: {
    model?: ('gpt-4o' | 'gpt-4-turbo' | 'gpt-4o-mini' | 'gpt-3.5-turbo') | null
  }
  'dalle-e-settings'?: {
    version?: ('dall-e-3' | 'dall-e-2') | null
    size?: ('256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792') | null
    style?: ('vivid' | 'natural') | null
    'enable-prompt-optimization'?: boolean | null
  }
  'openai-tts-settings'?: {
    voice?: ('alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer') | null
    model?: ('tts-1' | 'tts-1-hd') | null
    response_format?: ('mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm') | null
    speed?: number | null
  }
  'openai-gpt-object-settings'?: {
    model?: ('gpt-4o' | 'gpt-4-turbo' | 'gpt-4o-mini' | 'gpt-4o-2024-08-06') | null
    system?: string | null
    layout?: string | null
  }
  updatedAt: string
  createdAt: string
}
