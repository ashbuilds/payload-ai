import type { ImagePart } from 'ai'
import type { Payload } from 'payload'

import type { ProviderOptions } from '../types.js'

/**
 * Base interface for all media generation arguments
 */
export interface MediaGenerationArgs {
  model?: string
  payload: Payload
  prompt: string
  provider?: string
  providerOptions?: ProviderOptions
}

/**
 * Arguments specific to image generation
 */
export interface ImageGenerationArgs extends MediaGenerationArgs {
  aspectRatio?: string
  images?: ImagePart[]
  n?: number
  seed?: number
  size?: { height: number; width: number }
}

/**
 * Arguments specific to video generation
 */
export interface VideoGenerationArgs extends MediaGenerationArgs {
  callbackUrl?: string
  duration?: number
  fps?: number
  images?: ImagePart[]
  instructionId?: number | string
  mode?: 'i2v' | 't2v'
}

/**
 * Arguments specific to speech generation
 */
export interface SpeechGenerationArgs extends MediaGenerationArgs {
  audioFormat?: string
  speed?: number
  voice?: string
}

/**
 * Generated media file
 */
export interface MediaFile {
  data: Buffer
  mimetype: string
  name: string
  size: number
}

/**
 * Result from media generation
 * Can be either an immediate file result or an async job
 */
export interface MediaResult {
  // Immediate result (image, speech)
  file?: MediaFile

  // Async job result (video)
  jobId?: string
  progress?: number
  status?: 'completed' | 'failed' | 'queued' | 'running'
  taskId?: string
}

/**
 * Internal type for multimodal image files from AI SDK
 */
export interface MultimodalImageFile {
  base64Data?: string
  mediaType?: string
  uint8Array?: Uint8Array
}
