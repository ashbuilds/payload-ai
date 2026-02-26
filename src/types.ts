import type { GenerateObjectResult, ModelMessage } from 'ai'
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

import type { MediaResult } from './ai/core/index.js'
import type { PLUGIN_INSTRUCTIONS_TABLE } from './defaults.js'

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
  /**
   * Optional runtime environment map for non-Node runtimes (Cloudflare Workers, Edge runtimes).
   * Values in this map are checked before `process.env` during provider auto-setup.
   */
  env?: Partial<Record<string, string>>
  fields?: Field[]
  /**
   * Defines default provider and models to be selected
   * when creating initial database records for Generation Defaults.
   */
  generationDefaults?: {
    image?: { model: string; provider: string }
    text?: { model: string; provider: string }
    tts?: { model: string; provider: string; voice?: string }
    video?: { model: string; provider: string }
  }
  generationModels?: ((defaultModels: GenerationModel[]) => GenerationModel[]) | GenerationModel[]
  /**
   * Optional runtime resolver for environment values.
   * Resolution order is: `getEnv` -> `env` -> `process.env`.
   */
  getEnv?: (key: string) => string | undefined
  globals?: {
    [key: GlobalConfig['slug']]: boolean
  }
  interfaceName?: string
  mediaUpload?: PluginConfigMediaUploadFunction
  options?: PluginOptions
  overrideInstructions?: any
  promptFields?: any[]
  prompts?: ActionPrompt[]
  /**
   * Pre-configured options that get passed directly to AI SDK providers.
   * This allows devs to define AI options safely via payload.config.ts.
   */
  providerOptions?: {
    [key: string]: Record<string, any> | undefined // generic fallback
    anthropic?: Record<string, any>
    elevenlabs?: Record<string, any>
    fal?: Record<string, any>
    google?: Record<string, any>
    openai?: Record<string, any>
  }
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
  promptMentions: Endpoint
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

export type BeforeGenerateResult = {
  messages?: ModelMessage[]
  prompt?: string
  system?: string
} | void

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
  [key: string]: unknown
  afterGenerate?: AfterGenerateHook[]
  /**
   * When true, the Compose button is always visible on this field,
   * bypassing the focus-based show/hide system.
   * Admin `disabled` in Instructions still takes priority.
   */
  alwaysShow?: boolean
  /**
   * When true and the field hasMany, generated values are appended
   * instead of replacing current field value(s).
   */
  appendGenerated?: boolean
  beforeGenerate?: BeforeGenerateHook[]
  /**
   * Default hidden state for Compose in instructions.
   * When true, Compose is hidden for this field.
   */
  disabled?: boolean
  /**
   * Set to false to opt-out of compose button injection for this field.
   * When false, no compose button is injected at build time.
   * @default true (compose is auto-injected on supported field types)
   */
  enabled?: boolean
  /** Custom prompt template for this field */
  prompt?: string
  /** Custom system prompt for this field */
  system?: string
}
