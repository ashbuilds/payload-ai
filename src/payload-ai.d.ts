// Global type definitions for @ai-stack/payloadcms
// This file augments the Payload types using inline type definitions

import type { GenerateObjectResult, ImagePart, JSONValue, ModelMessage } from 'ai'
import type { z } from 'zod'

/**
 * Provider options compatible with AI SDK
 */
type ProviderOptions = Record<string, Record<string, JSONValue>>

/**
 * Base arguments for all generation methods
 */
interface PayloadGenerationBaseArgs {
  extractAttachments?: boolean
  maxTokens?: number
  messages?: ModelMessage[]
  model?: string
  prompt: string
  provider?: string
  providerOptions?: ProviderOptions
  system?: string
  temperature?: number
}

/**
 * Arguments for generateObject - structured output generation
 */
interface PayloadGenerateObjectArgs extends PayloadGenerationBaseArgs {
  images?: ImagePart[]
  mode?: 'auto' | 'json' | 'tool'
  onFinish?: (event: { object?: unknown }) => Promise<void> | void
  schema?: Record<string, unknown> | z.ZodTypeAny
}

/**
 * Arguments for generateText - simple text generation
 */
interface PayloadGenerateTextArgs extends PayloadGenerationBaseArgs {
  // No additional fields needed for basic text generation
}

/**
 * Arguments for generateMedia - image/video generation
 */
interface PayloadGenerateMediaArgs {
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
interface MediaResult {
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

declare module 'payload' {
  interface BasePayload {
    ai: {
      /**
       * @deprecated Use generateObject or generateText instead
       * Legacy generate method for backward compatibility
       */
      generate: (args: unknown) => Promise<unknown>

      /**
       * Generate media (images or videos)
       * @param args - Generation arguments including provider, model, prompt, and media options
       * @returns Promise resolving to either a file or async job info
       */
      generateMedia: (args: PayloadGenerateMediaArgs) => Promise<MediaResult>

      /**
       * Generate structured output with schema validation
       * @param args - Generation arguments including provider, model, prompt, and schema
       * @returns Promise resolving to the generated object
       */
      generateObject: <T = unknown>(args: PayloadGenerateObjectArgs) => Promise<GenerateObjectResult<T>>

      /**
       * Generate simple text output
       * @param args - Generation arguments including provider, model, and prompt
       * @returns Promise resolving to the generated text
       */
      generateText: (args: PayloadGenerateTextArgs) => Promise<string>

      /**
       * Get a specific model instance
       * @param provider - Provider name (e.g., 'openai', 'anthropic')
       * @param modelId - Model ID (e.g., 'gpt-4', 'claude-3')
       * @param type - Model type ('text', 'image', or 'tts')
       * @returns Promise resolving to the model instance
       */
      getModel: (provider: string, modelId: string, type?: 'image' | 'text' | 'tts') => Promise<unknown>

      /**
       * Get the provider registry
       * @returns Promise resolving to the provider registry
       */
      getRegistry: () => Promise<Record<string, unknown>>

      /**
       * Stream structured output with schema validation
       * @param args - Generation arguments including provider, model, prompt, and schema
       * @returns Response stream
       */
      streamObject: <T = unknown>(
        args: PayloadGenerateObjectArgs,
      ) => Promise<Response>

      /**
       * Stream text output
       * @param args - Generation arguments including provider, model, and prompt
       * @returns Response stream
       */
      streamText: (args: PayloadGenerateTextArgs) => Promise<Response>
    }
  }
}

export {}