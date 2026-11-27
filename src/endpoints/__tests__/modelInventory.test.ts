import type { PayloadRequest } from 'payload'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { modelInventoryEndpoint } from '../modelInventory.js'

const req = (provider = 'openai', user: unknown = { id: 1 }) =>
  ({ query: { provider }, t: (s: string) => s, user }) as unknown as PayloadRequest
const config = { collections: {}, providers: { openai: { apiKey: 'secret' } } }
afterEach(() => vi.unstubAllGlobals())

describe('authenticated model inventory endpoint', () => {
  it('enforces authentication and settings access before provider calls', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    await expect(modelInventoryEndpoint(config).handler(req('openai', null))).rejects.toThrow()
    await expect(
      modelInventoryEndpoint({ ...config, access: { settings: () => false } }).handler(req()),
    ).rejects.toThrow()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('filters non-text OpenAI candidates, caches, and never returns credentials', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        Response.json({
          data: [{ id: 'gpt-new' }, { id: 'gpt-image-2' }, { id: 'whisper-1' }, { id: 'o3' }],
        }),
      )
    vi.stubGlobal('fetch', fetch)
    const endpoint = modelInventoryEndpoint(config)
    const response = await endpoint.handler(req())
    const body = await response.json()
    expect(body.models.map((m: { id: string }) => m.id)).toEqual(['gpt-new', 'o3'])
    expect(JSON.stringify(body)).not.toContain('secret')
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer secret')
    expect(fetch.mock.calls[0][1].redirect).toBe('error')
    await endpoint.handler(req())
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('keeps custom gateways opt-in and accepts custom authentication when opted in', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ data: [{ id: 'gpt-gateway' }] }))
    vi.stubGlobal('fetch', fetch)
    const providers = {
      openai: {
        baseURL: 'https://gateway.example/v1',
        headers: { Authorization: 'Bearer custom' },
      },
    }
    expect(
      (await (await modelInventoryEndpoint({ collections: {}, providers }).handler(req())).json())
        .source,
    ).toBe('fallback')
    expect(fetch).not.toHaveBeenCalled()
    await modelInventoryEndpoint({
      collections: {},
      providers: { openai: { ...providers.openai, modelDiscovery: true } },
    }).handler(req())
    expect(fetch.mock.calls[0][1].headers.get('Authorization')).toBe('Bearer custom')
  })

  it('paginates Anthropic and only reports explicit capabilities', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          data: [
            {
              id: 'claude-a',
              capabilities: { structured_outputs: { supported: true } },
              max_tokens: 1000,
            },
          ],
          has_more: true,
          last_id: 'claude-a',
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          data: [
            { id: 'claude-b' },
            { id: 'claude-c', capabilities: { structured_outputs: { supported: false } } },
          ],
          has_more: false,
        }),
      )
    vi.stubGlobal('fetch', fetch)
    const response = await modelInventoryEndpoint({
      collections: {},
      providers: { anthropic: { apiKey: 'anth-secret' } },
    }).handler(req('anthropic'))
    expect((await response.json()).models).toEqual([
      { id: 'claude-a', label: 'claude-a', maxOutputTokens: 1000, structuredOutputs: true },
      { id: 'claude-b', label: 'claude-b' },
    ])
    expect(fetch.mock.calls[1][0].searchParams.get('after_id')).toBe('claude-a')
  })

  it('returns safe fallbacks on provider failures and rejects arbitrary providers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('secret provider response')))
    const endpoint = modelInventoryEndpoint(config)
    const body = await (await endpoint.handler(req())).json()
    expect(body.source).toBe('fallback')
    expect(JSON.stringify(body)).not.toContain('secret')
    expect((await endpoint.handler(req('https://attacker.example'))).status).toBe(400)
  })
})
