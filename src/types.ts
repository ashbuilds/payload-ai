import type { JSONSchema } from 'openai/lib/jsonschema'
import type { ImageGenerateParams } from 'openai/resources/images'
import type {
  CollectionSlug,
  DataFromCollectionSlug,
  Endpoint,
  Field,
  File,
  GlobalConfig,
  GroupField,
  PayloadRequest,
} from 'payload'
import type { CSSProperties, MouseEventHandler } from 'react'

export interface PluginConfigAccess {
  /**
   * Control access to AI generation features (generate text, images, audio)
   * @default () => !!req.user (requires authentication)
   */
  generate?: ({ req }: { req: PayloadRequest }) => Promise<boolean> | boolean
  /**
   * Control access to AI settings/configuration
   * @default () => !!req.user (requires authentication)
   */
  settings?: ({ req }: { req: PayloadRequest }) => Promise<boolean> | boolean
}

export interface PluginOptions {

  /**
   * Provide local tags to filter language options from the Translate Menu
   * Check for the available local tags,
   * visit: https://www.npmjs.com/package/locale-codes
   * Example: ["en-US", "zh-SG", "zh-CN", "en"]
   */
  enabledLanguages?: string[]
}

export type PluginConfigMediaUploadFunction = (
  result: { data: Record<any, any>; file: File },
  {
    collection,
    request,
  }: {
    collection: CollectionSlug
    request: PayloadRequest
  },
) => Promise<DataFromCollectionSlug<CollectionSlug>>

export interface PluginConfig {
  /**
   * Access control configuration for AI features
   * By default, all AI features require authentication
   */
  access?: PluginConfigAccess
  collections: {
    [key: CollectionSlug]: boolean
  }
  debugging?: boolean
  disableSponsorMessage?: boolean
  editorConfig?: { nodes: JSONSchema[] }
  fields?: Field[]
  generatePromptOnInit?: boolean
  generationModels?: ((defaultModels: GenerationModel[]) => GenerationModel[]) | GenerationModel[]
  globals?: {
    [key: GlobalConfig['slug']]: boolean
  }
  interfaceName?: string
  mediaUpload?: PluginConfigMediaUploadFunction
  options?: PluginOptions
  uploadCollectionSlug?: CollectionSlug
}

export interface GenerationModel {
  fields: string[]
  generateText?: (prompt: string, system: string) => Promise<string>
  handler?: (prompt: string, options: any) => Promise<any> | Response
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
  collectionSlug: CollectionSlug
  doc: T
  documentId?: number | string
  locale?: string
  options?: any
}) => Promise<string> | string

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

export type UseMenuOptions = {
  isConfigAllowed: boolean
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
  title?: string
}

export type ImageReference = {
  data: Blob
  name: string
  size: number
  type: string
  url: string
}

export type GenerateImageParams = {
  images?: ImageReference[]
  size?: ImageGenerateParams['size']
  style?: ImageGenerateParams['style']
  version?: ImageGenerateParams['model']
}
