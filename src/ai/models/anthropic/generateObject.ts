import { anthropic } from '@ai-sdk/anthropic'
import { jsonSchema, streamObject } from 'ai'

import { extractPromptAttachments } from '../../../utilities/extractPromptAttachments.js'
import { defaultSystemPrompt } from '../../prompts.js'

/**
 * Generic structured generation for simple object schemas using Anthropic models.
 * Expects options.schema to be a valid JSON Schema object.
 */
export const generateObject = (text: string, options: any = {}) => {
  const streamResult = streamObject({
    maxOutputTokens: options.maxTokens || 5000,
    model: anthropic(options.model),
    onError: (error) => {
      console.error(`anthropic.generateObject: `, error)
    },
    prompt: options.extractAttachments ? extractPromptAttachments(text) : text,
    schema: jsonSchema(options.schema),
    system: options.system || defaultSystemPrompt,
    temperature: options.temperature || 0.7,
  })

  return streamResult.toTextStreamResponse()
}
