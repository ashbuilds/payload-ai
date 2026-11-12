import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resolveProviderConfig } from '../../../providers/resolveProviderConfig.js'
import { generateObject } from '../../generateObject.js'
import { createOpenAIConfig } from '../index.js'
import {
  getOpenAITextModelOptions,
  OPENAI_TEXT_MODEL_REPLACEMENTS,
  resolveOpenAITextModel,
} from '../textModel.js'

vi.mock('../../generateObject.js', () => ({ generateObject: vi.fn() }))

beforeEach(() => vi.clearAllMocks())

describe('OpenAI text model migration', () => {
  it.each(Object.entries(OPENAI_TEXT_MODEL_REPLACEMENTS))(
    'resolves %s to %s',
    (model, replacement) => {
      expect(resolveOpenAITextModel(model)).toBe(replacement)
      expect(resolveOpenAITextModel(model, 'https://api.openai.com/v1/')).toBe(replacement)
    },
  )

  it.each(['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-5.6-sol', 'custom-model', 'toString'])(
    'preserves explicit or unknown model %s',
    (model) => expect(resolveOpenAITextModel(model)).toBe(model),
  )

  it.each([
    'https://gateway.example/v1',
    'https://api.openai.com.example/v1',
    'http://api.openai.com/v1',
  ])('does not rewrite IDs for custom endpoint %s', (baseURL) => {
    expect(resolveOpenAITextModel('gpt-5', baseURL)).toBe('gpt-5')
    expect(getOpenAITextModelOptions(baseURL)).toContainEqual({ label: 'gpt-5', value: 'gpt-5' })
  })

  it.each(['Oai-text', 'Oai-object'])(
    'migrates saved values in the %s handler and picker',
    async (id) => {
      const provider = resolveProviderConfig({
        openai: { apiKey: 'test', baseURL: 'https://api.openai.com/v1' },
      }).openai
      const model = createOpenAIConfig(provider).models.find((model) => model.id === id)!
      await model.handler!('Example', { maxTokens: 100, model: 'gpt-5-mini' })
      expect(generateObject).toHaveBeenCalledWith(
        'Example',
        expect.objectContaining({ maxTokens: 100 }),
        expect.objectContaining({ modelId: 'gpt-5.6-terra' }),
      )
      expect(model.settings).toMatchObject({
        fields: expect.arrayContaining([
          expect.objectContaining({
            name: 'model',
            options: expect.arrayContaining([
              'gpt-5.6-terra',
              { label: 'gpt-5-mini (uses gpt-5.6-terra)', value: 'gpt-5-mini' },
            ]),
          }),
        ]),
      })
    },
  )

  it.each(['Oai-text', 'Oai-object'])('preserves custom endpoint selections in %s', async (id) => {
    const provider = resolveProviderConfig({
      openai: { apiKey: 'test', baseURL: 'https://gateway.example/v1' },
    }).openai
    const model = createOpenAIConfig(provider).models.find((model) => model.id === id)!
    await model.handler!('Example', { model: 'gpt-5' })
    expect(generateObject).toHaveBeenCalledWith(
      'Example',
      expect.anything(),
      expect.objectContaining({ modelId: 'gpt-5' }),
    )
  })
})
