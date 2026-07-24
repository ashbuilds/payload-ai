import * as process from 'node:process'

import type { PluginConfigProviders } from '../../types.js'

const DEFAULT_MINIMAX_BASE_URL = 'https://api.minimax.io/v1'
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1'

export type ResolvedProviderConfig = ReturnType<typeof resolveProviderConfig>

export const resolveProviderConfig = (providers: PluginConfigProviders = {}) => {
  const openai = providers.openai ?? {}
  const anthropic = providers.anthropic ?? {}
  const google = providers.google ?? {}
  const elevenLabs = providers.elevenLabs ?? {}
  const minimax = providers.minimax ?? {}

  return {
    anthropic: {
      apiKey: anthropic.apiKey ?? process.env.ANTHROPIC_API_KEY,
      authToken: anthropic.authToken ?? process.env.ANTHROPIC_AUTH_TOKEN,
      baseURL: anthropic.baseURL ?? process.env.ANTHROPIC_BASE_URL,
      headers: anthropic.headers,
    },
    elevenLabs: {
      apiKey: elevenLabs.apiKey ?? process.env.ELEVENLABS_API_KEY,
    },
    google: {
      apiKey: google.apiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      baseURL: google.baseURL,
      headers: google.headers,
    },
    minimax: {
      apiKey: minimax.apiKey ?? process.env.MINIMAX_API_KEY,
      baseURL: minimax.baseURL ?? DEFAULT_MINIMAX_BASE_URL,
      headers: minimax.headers,
    },
    openai: {
      apiKey: openai.apiKey ?? process.env.OPENAI_API_KEY,
      baseURL: openai.baseURL ?? process.env.OPENAI_BASE_URL ?? DEFAULT_OPENAI_BASE_URL,
      headers: openai.headers,
      organization: openai.organization ?? openai.orgId ?? process.env.OPENAI_ORG_ID,
      project: openai.project ?? process.env.OPENAI_PROJECT,
    },
  }
}
