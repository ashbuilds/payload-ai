// Type definitions for payload.ai API
import type { Payload } from 'payload'

import type {
  MediaResult,
  PayloadGenerateMediaArgs,
  PayloadGenerateObjectArgs,
  PayloadGenerateTextArgs,
} from './ai/core/types.js'

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
      generateMedia: (args: Omit<PayloadGenerateMediaArgs, 'payload'>) => Promise<MediaResult>

      /**
       * Generate structured output with schema validation
       * @param args - Generation arguments including provider, model, prompt, and schema
       * @returns Promise resolving to the generated object
       */
      generateObject: <T = unknown>(args: Omit<PayloadGenerateObjectArgs, 'payload'>) => Promise<T>

      /**
       * Generate simple text output
       * @param args - Generation arguments including provider, model, and prompt
       * @returns Promise resolving to the generated text
       */
      generateText: (args: Omit<PayloadGenerateTextArgs, 'payload'>) => Promise<string>

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
        args: Omit<PayloadGenerateObjectArgs, 'payload'>,
      ) => Promise<Response>

      /**
       * Stream text output
       * @param args - Generation arguments including provider, model, and prompt
       * @returns Response stream
       */
      streamText: (args: Omit<PayloadGenerateTextArgs, 'payload'>) => Promise<Response>
    }
  }
}