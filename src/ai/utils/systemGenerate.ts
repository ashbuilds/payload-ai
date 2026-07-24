import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

import type { PluginConfigProviders } from '../../types.js'

import { PLUGIN_DEFAULT_ANTHROPIC_MODEL, PLUGIN_DEFAULT_OPENAI_MODEL } from '../../defaults.js'
import { createOpenAIProvider } from '../models/openai/openai.js'
import { resolveProviderConfig } from '../providers/resolveProviderConfig.js'

export const systemGenerate = async (
  data: { prompt: string; system: string },
  generateTextFn?: (prompt: string, system: string) => Promise<string>,
  providers?: PluginConfigProviders,
) => {
  const { prompt, system } = data

  if (generateTextFn) {
    return generateTextFn(prompt, system)
  }

  let model = null
  const resolvedProviders = resolveProviderConfig(providers)

  if (resolvedProviders.openai.apiKey) {
    model = createOpenAIProvider(resolvedProviders.openai)(PLUGIN_DEFAULT_OPENAI_MODEL)
  } else if (resolvedProviders.anthropic.apiKey || resolvedProviders.anthropic.authToken) {
    model = createAnthropic({
      apiKey: resolvedProviders.anthropic.apiKey,
      authToken: resolvedProviders.anthropic.authToken,
      baseURL: resolvedProviders.anthropic.baseURL,
      headers: resolvedProviders.anthropic.headers,
    })(PLUGIN_DEFAULT_ANTHROPIC_MODEL)
  } else {
    throw new Error('- AI Plugin: Please check your provider config or environment variables!')
  }

  const { text } = await generateText({
    model,
    prompt,
    system,
  })

  return text
}
