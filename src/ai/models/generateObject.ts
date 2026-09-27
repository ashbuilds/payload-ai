import type { LanguageModel } from 'ai'

import { createTextStreamResponse, jsonSchema, streamObject } from 'ai'

import { PLUGIN_TRUNCATED_MARKER } from '../../defaults.js'
import { extractPromptAttachments } from '../../utilities/extractPromptAttachments.js'

export interface GenerateObjectOptions {
  // Allow additional provider-specific params without typing friction
  [key: string]: any

  extractAttachments?: boolean
  maxTokens?: number
  // Provider-specific passthrough options (e.g., OpenAI strictJsonSchema)
  providerOptions?: Record<string, any>
  /** Injected by the endpoint; never sourced from saved model settings. */
  resolvePromptImage?: (url: string) => Promise<Blob>
  // Structured output schema (JSON Schema for object generation)
  schema?: Record<string, any>

  // Common generation options
  system?: string

  temperature?: number
}

export const generateObject = async (
  text: string,
  options: GenerateObjectOptions = {},
  model: LanguageModel,
) => {
  const prompt = options.extractAttachments
    ? await extractPromptAttachments(text, options.resolvePromptImage)
    : text

  const streamResult = streamObject({
    // Attachments must already be bytes, regardless of provider URL support.
    experimental_download: (downloads) => {
      if (downloads.length) {
        throw new Error('Unresolved attachment URLs are not allowed.')
      }
      return Promise.resolve([])
    },
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

  // Running into the model's output token limit is a regular finish, not an error: the response
  // just stops mid-object, and the browser has no way to tell that apart from a complete result.
  // The marker is that signal. Awaiting the finish reason cannot stall the response - the SDK
  // resolves it when the finish chunk arrives, before the text stream closes.
  const textStream = new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of streamResult.textStream) {
          controller.enqueue(chunk)
        }

        if ((await streamResult.finishReason) === 'length') {
          controller.enqueue(PLUGIN_TRUNCATED_MARKER)
        }

        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
  })

  return createTextStreamResponse({ textStream })
}
