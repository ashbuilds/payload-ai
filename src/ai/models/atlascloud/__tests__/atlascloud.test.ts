import * as process from 'node:process'
import { describe, expect, it } from 'vitest'

describe('atlascloud provider — unit', () => {
  it('exports ATLASCLOUD-text and ATLASCLOUD-object models', async () => {
    const { AtlasCloudConfig } = await import('../index.js')
    expect(AtlasCloudConfig.provider).toBe('Atlas Cloud')
    const text = AtlasCloudConfig.models.find((m) => m.id === 'ATLASCLOUD-text')
    const object = AtlasCloudConfig.models.find((m) => m.id === 'ATLASCLOUD-object')
    expect(text!.fields).toEqual(['text', 'textarea'])
    expect(object!.fields).toEqual(['richText'])
    expect(AtlasCloudConfig.models).toHaveLength(2)
  })

  it('defaults to deepseek-ai/deepseek-v4-flash', async () => {
    const { AtlasCloudConfig } = await import('../index.js')
    const text = AtlasCloudConfig.models.find((m) => m.id === 'ATLASCLOUD-text')
    const field = (text!.settings!.fields as any[]).find((f: any) => f.name === 'model')
    expect(field.defaultValue).toBe('deepseek-ai/deepseek-v4-flash')
    expect(field.options).toContain('moonshotai/kimi-k3')
  })

  it('settings condition matches only its own model id', async () => {
    const { AtlasCloudConfig } = await import('../index.js')
    const text = AtlasCloudConfig.models.find((m) => m.id === 'ATLASCLOUD-text')
    const condition = text!.settings!.admin!.condition!
    expect(condition({ 'model-id': 'ATLASCLOUD-text' }, {}, {} as any)).toBe(true)
    expect(condition({ 'model-id': 'ATLASCLOUD-object' }, {}, {} as any)).toBe(false)
  })

  it('creates a language model pointing at the Atlas Cloud base URL', async () => {
    const { resolveProviderConfig } = await import('../../../providers/resolveProviderConfig.js')
    expect(resolveProviderConfig().atlascloud.baseURL).toBe('https://api.atlascloud.ai/v1')
    const { atlascloud } = await import('../atlascloud.js')
    const model = atlascloud('deepseek-ai/deepseek-v4-flash') as any
    expect(model.modelId).toBe('deepseek-ai/deepseek-v4-flash')
  })
})

const runIntegration = !!process.env.ATLASCLOUD_API_KEY

describe.skipIf(!runIntegration)('atlascloud provider — integration', () => {
  it('text handler returns a Response for a simple prompt', async () => {
    const { AtlasCloudConfig } = await import('../index.js')
    const text = AtlasCloudConfig.models.find((m) => m.id === 'ATLASCLOUD-text')!
    const schema = {
      type: 'object',
      properties: { result: { type: 'string' } },
      required: ['result'],
    }
    const response = await text.handler!('Say hello in one word', {
      maxTokens: 50,
      model: 'deepseek-ai/deepseek-v4-flash',
      schema,
      temperature: 0.5,
    })
    expect(response instanceof Response).toBe(true)
  }, 30_000)
})
