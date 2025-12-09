import { jsonSchema, streamObject as sdkStreamObject } from 'ai'

import type { PayloadGenerateObjectArgs } from './types.js'

import { extractPromptAttachments } from '../../utilities/extractPromptAttachments.js'
import { getLanguageModel } from '../providers/registry.js'

function isZodSchema(schema: unknown): boolean {
  return typeof schema === 'object' && schema !== null && '_def' in schema
}

/**
 * Stream structured output using AI SDK's streamObject
 * This is a thin wrapper that resolves the model from the registry
 * and passes everything directly to the AI SDK for streaming
 */
export async function streamObject(args: PayloadGenerateObjectArgs) {
  const { 
    maxTokens, 
    mode,
    model: modelId,
    payload,
    prompt,
    provider,
    providerOptions,
    schema,
    system,
    temperature,
    ...rest
  } = args
  
  // Extract attachments if needed
  const processedPrompt = (rest as { extractAttachments?: boolean }).extractAttachments 
    ? extractPromptAttachments(prompt) 
    : prompt
  
  // Resolve model from registry
  const model = await getLanguageModel(payload, provider, modelId, providerOptions)
  
  // Return streaming result from AI SDK
  const options: Record<string, unknown> = {
    mode: mode || 'auto',
    model,
    schema: schema ? (isZodSchema(schema) ? schema : jsonSchema(schema as Record<string, unknown>)) : undefined,
    system,
    temperature: temperature ?? 0.7,
    ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
  }

  if (args.messages) {
    options.messages = args.messages
  } else {
    options.prompt = processedPrompt
  }

  if (providerOptions) {
    options.providerOptions = providerOptions
  }

  return sdkStreamObject(options as Parameters<typeof sdkStreamObject>[0])
}
