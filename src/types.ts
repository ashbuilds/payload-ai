import type { DocumentInfoContext, FormFieldBase } from '@payloadcms/ui'
import type { Endpoint, Field, GroupField } from 'payload'

import { TextareaField as TextareaFieldType } from 'payload'

export type AIPluginConfig = {
  collections?: string[]
  fields?: Field[]
  globals?: string[]
  interfaceName?: string
}

export type GenerationModel = {
  fields: string[]
  handler?: (payload: any, options: any) => Promise<any>
  id: string
  name: string
  output: 'audio' | 'file' | 'image' | 'json' | 'text' | 'video'
  settings?: GroupField
  supportsPromptOptimization?: boolean
}

export type GenerationConfig = {
  models: GenerationModel[]
  provider: string
}

export type GenerateTextarea<T = any> = (
  args: {
    doc: T
    locale?: string
    options?: any
  } & DocumentInfoContext,
) => Promise<string> | string

export type Instructions = {
  'collection-slug': string
  id: string
  'model-id': string
  prompt: string
}

export type Endpoints = {
  textarea: Omit<Endpoint, 'root'>
  upload: Omit<Endpoint, 'root'>
}
