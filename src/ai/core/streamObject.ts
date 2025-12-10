import { type ImagePart, jsonSchema, streamObject as sdkStreamObject, type TextPart } from 'ai'

import type { PayloadGenerateObjectArgs } from './types.js'

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

  // Handle multimodal input
  if ((args.images && args.images.length > 0) || (args.messages && args.messages.length > 0)) {
    if (args.messages) {
      options.messages = args.messages
    } else {
      // Construct multimodal message from prompt and images
      const content: Array<ImagePart | TextPart> = [
        { type: 'text', text: prompt },
        ...(args.images || []),
      ]

      options.messages = [
        { content, role: 'user' as const },
      ]
    }
  } else {
    options.prompt = prompt
  }

  console.log("options.messages  : ",options.messages)
  console.log('prompt  : ', prompt)
  console.log('args.images   : ', args.images)

  if (providerOptions) {
    options.providerOptions = providerOptions
  }

  return sdkStreamObject(options as Parameters<typeof sdkStreamObject>[0])
}
