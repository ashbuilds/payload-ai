import type { DocumentInfoContext } from '@payloadcms/ui'
import type { Config, Endpoint, Field, GroupField } from 'payload'

export interface PluginConfig {
  collections?: string[]
  fields?: Field[]
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

export type GenerateTextarea<T = any> = (
  args: {
    doc: T
    locale?: string
    options?: any
  } & DocumentInfoContext,
) => Promise<string> | string

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
