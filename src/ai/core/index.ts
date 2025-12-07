/**
 * AI Core Module
 * Thin wrappers around AI SDK functions with model resolution from registry
 */

export { generateObject } from './generateObject.js'
export { generateText } from './generateText.js'
export { generateMedia } from './media/index.js'
// Re-export media types
export type { ImageGenerationArgs, MediaResult, SpeechGenerationArgs, VideoGenerationArgs } from './media/types.js'
export { streamObject } from './streamObject.js'

export { streamText } from './streamText.js'

// Export types (excluding conflicting ones from media/types.js)
export type {
  PayloadGenerateMediaArgs,
  PayloadGenerateObjectArgs,
  PayloadGenerateTextArgs,
  ProviderOptions,
} from './types.js'
