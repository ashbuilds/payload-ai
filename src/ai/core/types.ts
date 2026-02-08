import type { ImagePart, JSONValue, ModelMessage } from 'ai'
import type { Payload } from 'payload'
import type { z } from 'zod'

/**
 * Provider options compatible with AI SDK's SharedV2ProviderOptions
 * SharedV2ProviderOptions = Record<string, Record<string, JSONValue>>
 */
export type ProviderOptions = Record<string, Record<string, JSONValue>>

/**
 * Base arguments for all generation methods
 */
export interface PayloadGenerationBaseArgs {
  extractAttachments?: boolean
  maxTokens?: number
  messages?: ModelMessage[]
  model?: string
  payload: Payload
  prompt: string
  provider?: string
  providerOptions?: ProviderOptions
  system?: string
  temperature?: number
}

/**
 * Arguments for generateObject - structured output generation
 */
export interface PayloadGenerateObjectArgs extends PayloadGenerationBaseArgs {
  images?: ImagePart[]
  mode?: 'auto' | 'json' | 'tool'
  onFinish?: (event: { object?: any }) => Promise<void> | void
  schema?: Record<string, unknown> | z.ZodTypeAny
}

/**
 * Arguments for generateText - simple text generation
 */
export interface PayloadGenerateTextArgs extends PayloadGenerationBaseArgs {
  // No additional fields needed for basic text generation
}

/**
 * Arguments for generateMedia - image/video generation
 */
export interface PayloadGenerateMediaArgs {
  aspectRatio?: string
  audioFormat?: string
  callbackUrl?: string
  duration?: number
  fps?: number
  images?: ImagePart[]
  instructionId?: number | string
  mode?: 'i2v' | 't2v'
  model?: string
  n?: number
  payload: Payload
  prompt: string
  provider?: string
  providerOptions?: ProviderOptions
  seed?: number
  size?: { height: number; width: number }
  speed?: number
  voice?: string
}

/**
 * Result from generateMedia - can be immediate file or async job
 */
export interface MediaResult {
  // Immediate result (image generation)
  file?: {
    data: Buffer
    mimetype: string
    name: string
    size: number
  }
  
  // Async job result (video generation)
  jobId?: string
  progress?: number
  status?: 'completed' | 'failed' | 'queued' | 'running'
  taskId?: string
}

/**
 * Internal type for multimodal image files
 */
export interface MultimodalImageFile {
  base64Data?: string
  mediaType?: string
  uint8Array?: Uint8Array
}
