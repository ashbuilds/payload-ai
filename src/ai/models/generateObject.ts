import type { LanguageModel } from 'ai'

import { jsonSchema, streamObject } from 'ai'

import { extractPromptAttachments } from '../../utilities/extractPromptAttachments.js'

export interface GenerateObjectOptions {
  // Allow additional provider-specific params without typing friction
  [key: string]: any

  extractAttachments?: boolean
  maxTokens?: number
  // Provider-specific passthrough options (e.g., OpenAI strictJsonSchema)
  providerOptions?: Record<string, any>
  // Structured output schema (JSON Schema for object generation)
  schema?: Record<string, any>

  // Common generation options
  system?: string

  temperature?: number
}

export const generateObject = (
  text: string,
  options: GenerateObjectOptions = {},
  model: LanguageModel,
) => {
  const prompt = options.extractAttachments ? extractPromptAttachments(text) : text

    const streamResult = streamObject({
      maxOutputTokens: options.maxTokens || 5000,
      model,
      onError: (error) => {
        console.error('generateObject (structured): ', error)
      },
      prompt,
      schema: jsonSchema(options.schema as any),
      system: options.system,
      temperature: options.temperature ?? 0.7,
      ...(options.providerOptions ? { providerOptions: options.providerOptions } : {}),
    })

    return streamResult.toTextStreamResponse()
}
