import type { JSONSchema } from 'openai/lib/jsonschema'
import type { ImageGenerateParams } from 'openai/resources/images'
import type {
  CollectionConfig,
  CollectionSlug,
  DataFromCollectionSlug,
  Endpoint,
  Field,
  File,
  GlobalConfig,
  GroupField,
  PayloadRequest,
  TypedCollection,
} from 'payload'
import type { CSSProperties, MouseEventHandler } from 'react'

import type { GenerateObjectResult, ModelMessage } from 'ai'
import type { MediaResult } from './ai/core/index.js'
import type {PLUGIN_INSTRUCTIONS_TABLE} from "./defaults.js";

export interface PluginConfigAccess {
  /**
   * Control access to AI generation features (generate text, images, audio)
   * @default () => !!req.user (requires authentication)
   */
  generate?: ({ req }: { req: PayloadRequest }) => boolean | Promise<boolean>
  /**
   * Control access to AI settings/configuration
   * @default () => !!req.user (requires authentication)
   */
  settings?: ({ req }: { req: PayloadRequest }) => boolean | Promise<boolean>
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
  result: MediaResult,
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
  debugging?: boolean
  disableSponsorMessage?: boolean
  editorConfig?: { nodes: JSONSchema[] }
  fields?: Field[]
  generationModels?: ((defaultModels: GenerationModel[]) => GenerationModel[]) | GenerationModel[]
  globals?: {
    [key: GlobalConfig['slug']]: boolean
  }
  interfaceName?: string
  mediaUpload?: PluginConfigMediaUploadFunction
  options?: PluginOptions
  // Override the instructions collection config
  overrideInstructions?: Partial<CollectionConfig>
  promptFields?: PromptField[]
  /**
   * Custom action prompts for AI text generation
   * If not provided, uses default prompts
   * You can access default prompts by importing { defaultPrompts } from '@ai-stack/payloadcms'
   */
  prompts?: ActionPrompt[]
  /**
   * Custom seed prompt function for generating field-specific prompts
   * If not provided, fields will have empty prompts by default
   */
  seedPrompts?: SeedPromptFunction
  uploadCollectionSlug?: CollectionSlug
}

export interface GenerationModel {
  fields: string[]
  generateText?: (prompt: string, system: string) => Promise<string>
  handler?: (prompt: string, options: any) => File | Promise<any> | Response
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
  fetchVoices?: Omit<Endpoint, 'root'>
  textarea: Omit<Endpoint, 'root'>
  upload: Omit<Endpoint, 'root'>
  videogenWebhook?: Omit<Endpoint, 'root'>
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

export type ActionPromptOptions = {
  layout?: string
  locale?: string
  prompt?: string
  systemPrompt?: string
}

export type ActionPrompt = {
  layout?: (options?: ActionPromptOptions) => string
  name: ActionMenuItems
  system: (options: ActionPromptOptions) => string
}

export type SeedPromptOptions = {
  fieldLabel: string
  fieldSchemaPaths: Record<string, any>
  fieldType: string
  path: string
}

export type SeedPromptData = Omit<
  TypedCollection[typeof PLUGIN_INSTRUCTIONS_TABLE],
  'createdAt' | 'id' | 'updatedAt'
>

export type SeedPromptResult =
  | {
      data?: SeedPromptData
    }
  | {
      data?: SeedPromptData
      prompt: string
      system: string
    }
  | false
  | undefined
  | void

export type SeedPromptFunction = (
  options: SeedPromptOptions,
) => Promise<SeedPromptResult> | SeedPromptResult

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

export type SerializedPromptField = {
  collections?: CollectionSlug[]
  name: string
}

export type PromptFieldGetterContext = {
  collection: CollectionSlug
  type: string
}

export type PromptField = {
  // If not provided, the value will be returned from the data object as-is
  getter?: (data: object, ctx: PromptFieldGetterContext) => Promise<string> | string
} & SerializedPromptField

export interface BeforeGenerateArgs<T = any> {
  doc: T
  field: Field
  headers: Record<string, string>
  instructions: Record<string, unknown> // The instruction document
  messages?: ModelMessage[]
  payload: PayloadRequest['payload']
  prompt: string
  req: PayloadRequest
  system: string
}

export type BeforeGenerateResult =
  | {
      messages?: ModelMessage[]
      prompt?: string
      system?: string
    }
  | void

export type BeforeGenerateHook<T = any> = (
  args: BeforeGenerateArgs<T>,
) => BeforeGenerateResult | Promise<BeforeGenerateResult>

export interface AfterGenerateArgs<T = any> {
  doc: T
  field: Field
  headers: Record<string, string>
  instructions: Record<string, unknown>
  payload: PayloadRequest['payload']
  req: PayloadRequest
  result: GenerateObjectResult<any> | MediaResult | string // depends on context
}

export type AfterGenerateHook<T = any> = (args: AfterGenerateArgs<T>) => Promise<void> | void

// Add to PluginConfig or a new interface if accessed via custom.ai
export interface AIFieldConfig {
  afterGenerate?: AfterGenerateHook[]
  beforeGenerate?: BeforeGenerateHook[]
  [key: string]: unknown
}
