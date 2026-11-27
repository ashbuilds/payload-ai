import type { resolveProviderConfig } from './resolveProviderConfig.js'

export type InventoryModel = {
  id: string
  label: string
  maxOutputTokens?: number
  structuredOutputs?: boolean
}

type Inventory = { message?: string; models: InventoryModel[]; source: 'fallback' | 'live' }
type Provider = 'anthropic' | 'openai'

// OpenAI does not publish modality/endpoint capabilities in /models. These are candidates,
// not a guarantee of Responses or structured-output compatibility. Custom IDs remain editable.
const isTextCandidate = (id: string) =>
  /^(?:gpt-|chatgpt-|o\d|ft:)/.test(id) &&
  !/image|audio|realtime|transcribe|tts|search|embedding|moderation/.test(id)

const fallback = (message: string): Inventory => ({ message, models: [], source: 'fallback' })

export const createModelInventory = (providers: ReturnType<typeof resolveProviderConfig>) => {
  // Per plugin instance: credentials, tenants, and separate Payload applications never share caches.
  const cache = new Map<Provider, { expires: number; value: Promise<Inventory> }>()

  const discover = async (provider: Provider): Promise<Inventory> => {
    const settings = providers[provider]
    const baseURL =
      settings.baseURL ||
      (provider === 'openai' ? 'https://api.openai.com/v1' : 'https://api.anthropic.com/v1')
    const official =
      new URL(baseURL).origin ===
      (provider === 'openai' ? 'https://api.openai.com' : 'https://api.anthropic.com')
    if (settings.modelDiscovery === false || (!official && settings.modelDiscovery !== true)) {
      return fallback(
        'Live discovery is disabled for this provider. Saved and custom IDs remain available.',
      )
    }
    const headers = new Headers(settings.headers)
    if (provider === 'openai') {
      if (settings.apiKey && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${settings.apiKey}`)
      }
      if (providers.openai.organization && !headers.has('OpenAI-Organization')) {
        headers.set('OpenAI-Organization', providers.openai.organization)
      }
      if (providers.openai.project && !headers.has('OpenAI-Project')) {
        headers.set('OpenAI-Project', providers.openai.project)
      }
    } else {
      if (!headers.has('anthropic-version')) {
        headers.set('anthropic-version', official ? '2026-10-21' : '2023-06-01')
      }
      if (providers.anthropic.authToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${providers.anthropic.authToken}`)
      } else if (settings.apiKey && !headers.has('x-api-key')) {
        headers.set('x-api-key', settings.apiKey)
      }
    }
    if (!headers.has('Authorization') && !headers.has('x-api-key')) {
      return fallback('Provider credentials are not configured.')
    }
    const models = new Map<string, InventoryModel>()
    let after: string | undefined
    const signal = AbortSignal.timeout(8000)
    for (let page = 0; page < 10; page++) {
      const url = new URL(`${baseURL.replace(/\/$/, '')}/models`)
      if (provider === 'anthropic') {
        url.searchParams.set('limit', '100')
        if (after) {
          url.searchParams.set('after_id', after)
        }
      }
      const response = await fetch(url, { headers, redirect: 'error', signal })
      if (!response.ok) {
        throw new Error('Model discovery unavailable')
      }
      const body = await response.json()
      if (!Array.isArray(body.data)) {
        throw new Error('Invalid model inventory')
      }
      for (const item of body.data.slice(0, 2000)) {
        if (typeof item.id !== 'string' || item.id.length > 256) {
          continue
        }
        if (provider === 'openai' && !isTextCandidate(item.id)) {
          continue
        }
        if (
          typeof item.shutdown_date === 'string' &&
          Date.parse(item.shutdown_date) <= Date.now()
        ) {
          continue
        }
        if (item.capabilities?.structured_outputs?.supported === false) {
          continue
        }
        models.set(item.id, {
          id: item.id,
          label: typeof item.display_name === 'string' ? item.display_name : item.id,
          ...(Number.isSafeInteger(item.max_tokens) && item.max_tokens > 0
            ? { maxOutputTokens: item.max_tokens }
            : {}),
          ...(typeof item.capabilities?.structured_outputs?.supported === 'boolean'
            ? { structuredOutputs: item.capabilities.structured_outputs.supported }
            : {}),
        })
      }
      if (provider === 'openai' || !body.has_more) {
        break
      }
      if (typeof body.last_id !== 'string' || body.last_id === after || page === 9) {
        throw new Error('Incomplete model inventory')
      }
      after = body.last_id
    }
    return models.size
      ? { models: [...models.values()].sort((a, b) => a.id.localeCompare(b.id)), source: 'live' }
      : fallback('No compatible candidates were returned. Saved and custom IDs remain available.')
  }

  return (provider: Provider): Promise<Inventory> => {
    let entry = cache.get(provider)
    if (!entry || entry.expires < Date.now()) {
      entry = {
        expires: Date.now() + 300_000,
        value: discover(provider).catch(() =>
          fallback(
            'Live discovery is unavailable. Using saved choices; you can enter a model ID manually.',
          ),
        ),
      }
      cache.set(provider, entry)
    }
    return entry.value
  }
}
