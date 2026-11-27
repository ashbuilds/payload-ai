import { generateText } from 'ai'
import { afterEach, expect, it, vi } from 'vitest'

import { systemGenerate } from '../systemGenerate.js'

vi.mock('ai', () => ({ generateText: vi.fn().mockResolvedValue({ text: 'result' }) }))
afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

it.each([
  [undefined, 'claude-sonnet-4-6'],
  ['https://api.anthropic.com/v1', 'claude-sonnet-4-6'],
  ['https://gateway.example/v1', 'claude-3-5-sonnet-latest'],
])('preserves seeding default for endpoint %s', async (baseURL, expected) => {
  vi.stubEnv('OPENAI_API_KEY', '')
  await systemGenerate({ prompt: 'test', system: 'test' }, undefined, {
    anthropic: { apiKey: 'test', baseURL },
  })
  expect(generateText).toHaveBeenCalledWith(
    expect.objectContaining({ model: expect.objectContaining({ modelId: expected }) }),
  )
})

it('retains the explicit generateText override', async () => {
  const override = vi.fn().mockResolvedValue('custom')
  expect(await systemGenerate({ prompt: 'p', system: 's' }, override)).toBe('custom')
  expect(generateText).not.toHaveBeenCalled()
})
