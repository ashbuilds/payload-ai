/**
 * Core abstraction layer for payload.ai
 * Thin wrappers around AI SDK functions with model resolution from registry
 */

export { generateMedia } from './generateMedia.js'
export { generateObject } from './generateObject.js'
export { generateText } from './generateText.js'
export { streamObject } from './streamObject.js'
export { streamText } from './streamText.js'

export type {
  MediaResult,
  MultimodalImageFile,
  PayloadGenerateMediaArgs,
  PayloadGenerateObjectArgs,
  PayloadGenerateTextArgs,
} from './types.js'
