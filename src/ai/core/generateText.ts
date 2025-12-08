import { generateText as sdkGenerateText } from 'ai'

import type { PayloadGenerateTextArgs } from './types.js'

import { extractPromptAttachments } from '../../utilities/extractPromptAttachments.js'
import { getLanguageModel } from '../providers/registry.js'

/**
 * Generate simple text using AI SDK's generateText
 * This is a thin wrapper that resolves the model from the registry
 * and passes everything directly to the AI SDK
 */
export async function generateText(args: PayloadGenerateTextArgs) {
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
  
  // Resolve model from registry with provider options
  const model = await getLanguageModel(payload, provider, modelId, providerOptions)
  
  // Pass directly to AI SDK
  const options: Record<string, unknown> = {
    model,
    prompt: processedPrompt,
    system,
    temperature: temperature ?? 0.7,
    ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
  }

  // Also pass providerOptions to generateText for per-call overrides if supported by SDK/Model
  if (providerOptions) {
    options.providerOptions = providerOptions
  }

  return sdkGenerateText(options as Parameters<typeof sdkGenerateText>[0])
}
