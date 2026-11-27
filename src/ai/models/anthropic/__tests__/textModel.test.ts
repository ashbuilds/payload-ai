import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveProviderConfig } from '../../../providers/resolveProviderConfig.js'
import { generateObject } from '../../generateObject.js'
import { createAnthropicConfig } from '../index.js'
import {
  ANTHROPIC_TEXT_MODEL_REPLACEMENTS,
  getAnthropicTextModelOptions,
  resolveAnthropicTextModel,
} from '../textModel.js'

vi.mock('../../generateObject.js', () => ({ generateObject: vi.fn() }))

beforeEach(() => vi.clearAllMocks())

describe('Anthropic text model migration', () => {
  it.each(Object.entries(ANTHROPIC_TEXT_MODEL_REPLACEMENTS))(
    'resolves %s to %s',
    (model, replacement) => {
      expect(resolveAnthropicTextModel(model)).toBe(replacement)
      expect(resolveAnthropicTextModel(model, 'https://api.anthropic.com/v1')).toBe(replacement)
    },
  )

  it.each(['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5', 'custom-model', 'toString'])(
    'preserves explicit or unknown model %s',
    (model) => expect(resolveAnthropicTextModel(model)).toBe(model),
  )

  it.each([
    'https://gateway.example/v1',
    'https://api.anthropic.com.example/v1',
    'http://api.anthropic.com/v1',
  ])('does not rewrite IDs for custom endpoint %s', (baseURL) => {
    expect(resolveAnthropicTextModel('claude-sonnet-4-0', baseURL)).toBe('claude-sonnet-4-0')
    expect(getAnthropicTextModelOptions(baseURL)).toContainEqual({
      label: 'claude-sonnet-4-0',
      value: 'claude-sonnet-4-0',
    })
  })

  it.each(['ANTH-C-text', 'ANTH-C-object'])(
    'migrates saved values in the %s handler and picker',
    async (id) => {
      const provider = resolveProviderConfig({
        anthropic: { apiKey: 'test', modelDiscovery: false },
      }).anthropic
      const model = createAnthropicConfig(provider).models.find((model) => model.id === id)!
      await model.handler!('Example', { maxTokens: 100, model: 'claude-3-5-sonnet-latest' })
      expect(generateObject).toHaveBeenCalledWith(
        'Example',
        expect.objectContaining({ maxTokens: 100 }),
        expect.objectContaining({ modelId: 'claude-sonnet-4-6' }),
      )
      const field = model.settings?.fields.find(
        (field) => 'name' in field && field.name === 'model',
      )
      expect(field).toMatchObject({
        type: 'text',
        admin: {
          components: {
            Field: {
              clientProps: {
                fallbackOptions: getAnthropicTextModelOptions(provider.baseURL),
                provider: 'anthropic',
              },
            },
          },
        },
      })
    },
  )

  it.each(['ANTH-C-text', 'ANTH-C-object'])(
    'preserves custom endpoint selections in %s',
    async (id) => {
      const provider = resolveProviderConfig({
        anthropic: { apiKey: 'test', baseURL: 'https://gateway.example/v1' },
      }).anthropic
      const model = createAnthropicConfig(provider).models.find((model) => model.id === id)!
      await model.handler!('Example', { model: 'claude-sonnet-4-0' })
      expect(generateObject).toHaveBeenCalledWith(
        'Example',
        expect.anything(),
        expect.objectContaining({ modelId: 'claude-sonnet-4-0' }),
      )
    },
  )
})
