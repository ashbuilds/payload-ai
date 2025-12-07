import { jsonSchema, generateObject as sdkGenerateObject } from 'ai'

import type { PayloadGenerateObjectArgs } from './types.js'

function isZodSchema(schema: unknown): boolean {
  return typeof schema === 'object' && schema !== null && '_def' in schema
}

import { extractPromptAttachments } from '../../utilities/extractPromptAttachments.js'
import { getLanguageModel } from '../providers/registry.js'

/**
 * Generate structured output using AI SDK's generateObject
 * This is a thin wrapper that resolves the model from the registry
 * and passes everything directly to the AI SDK
 */
export async function generateObject(args: PayloadGenerateObjectArgs) {
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

  // Extract attachments if needed (from existing utility)
  const processedPrompt = (rest as any).extractAttachments
    ? extractPromptAttachments(prompt)
    : prompt

  // Resolve model from registry
  const model = await getLanguageModel(payload, provider, modelId)

  // Pass directly to AI SDK with minimal transformation
  const options: Record<string, unknown> = {
    mode: mode || 'auto',
    model,
    prompt: processedPrompt,
    schema: schema ? (isZodSchema(schema) ? schema : jsonSchema(schema as any)) : undefined,
    system,
    temperature: temperature ?? 0.7,
    ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
  }

  if (providerOptions) {
    options.providerOptions = providerOptions
  }

  return sdkGenerateObject(options as Parameters<typeof sdkGenerateObject>[0])
}
