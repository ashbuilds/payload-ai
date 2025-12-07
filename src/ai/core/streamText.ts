import { streamText as sdkStreamText } from 'ai'

import type { PayloadGenerateTextArgs } from './types.js'

import { extractPromptAttachments } from '../../utilities/extractPromptAttachments.js'
import { getLanguageModel } from '../providers/registry.js'

/**
 * Stream text using AI SDK's streamText
 * This is a thin wrapper that resolves the model from the registry
 * and passes everything directly to the AI SDK for streaming
 */
export async function streamText(args: PayloadGenerateTextArgs) {
  const { 
    maxTokens, 
    model: modelId, 
    payload,
    prompt,
    provider,
    providerOptions,
    system,
    temperature,
    ...rest
  } = args
  
  // Extract attachments if needed
  const processedPrompt = (rest as any).extractAttachments 
    ? extractPromptAttachments(prompt) 
    : prompt
  
  // Resolve model from registry
  const model = await getLanguageModel(payload, provider, modelId)
  
  // Return streaming result from AI SDK
  const options: Record<string, unknown> = {
    model,
    prompt: processedPrompt,
    system,
    temperature: temperature ?? 0.7,
    ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
  }

  if (providerOptions) {
    options.providerOptions = providerOptions
  }

  return sdkStreamText(options as Parameters<typeof sdkStreamText>[0])
}
