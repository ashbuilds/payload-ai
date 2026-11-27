import { afterEach, expect, it, vi } from 'vitest'

import { resolveProviderConfig } from '../../../providers/resolveProviderConfig.js'
import { generateObject } from '../../generateObject.js'
import { createAnthropicConfig } from '../index.js'

vi.mock('../../generateObject.js', () => ({ generateObject: vi.fn() }))
afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

it.each(['ANTH-C-text', 'ANTH-C-object'])(
  'caps %s tokens only at explicit discovered limit, after alias resolution',
  async (id) => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ data: [{ id: 'claude-sonnet-4-6', max_tokens: 2000 }] }),
        ),
    )
    const config = createAnthropicConfig(
      resolveProviderConfig({ anthropic: { apiKey: 'test' } }).anthropic,
    )
    const model = config.models.find((m) => m.id === id)!
    await model.handler!('prompt', { maxTokens: 5000, model: 'claude-3-5-sonnet-latest' })
    expect(generateObject).toHaveBeenLastCalledWith(
      'prompt',
      expect.objectContaining({ maxTokens: 2000 }),
      expect.anything(),
    )
    await model.handler!('prompt', { maxTokens: 100, model: 'claude-sonnet-4-6' })
    expect(generateObject).toHaveBeenLastCalledWith(
      'prompt',
      expect.objectContaining({ maxTokens: 100 }),
      expect.anything(),
    )
    await model.handler!('prompt', { maxTokens: 5000, model: 'claude-unknown' })
    expect(generateObject).toHaveBeenLastCalledWith(
      'prompt',
      expect.objectContaining({ maxTokens: 5000 }),
      expect.anything(),
    )
  },
)

it('does not change requested limits when discovery fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  const model = createAnthropicConfig(
    resolveProviderConfig({ anthropic: { apiKey: 'test' } }).anthropic,
  ).models[0]
  await model.handler!('prompt', { maxTokens: 5000, model: 'claude-sonnet-4-6' })
  expect(generateObject).toHaveBeenCalledWith(
    'prompt',
    expect.objectContaining({ maxTokens: 5000 }),
    expect.anything(),
  )
})
