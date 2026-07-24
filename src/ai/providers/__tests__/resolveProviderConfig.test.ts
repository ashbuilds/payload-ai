import * as process from 'node:process'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { PluginConfig } from '../../../types.js'

import { getGenerationModels } from '../../../utilities/getGenerationModels.js'
import { getDefaultGenerationModels } from '../../models/index.js'
import { resolveProviderConfig } from '../resolveProviderConfig.js'

const providerEnvKeys = [
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_AUTH_TOKEN',
  'ANTHROPIC_BASE_URL',
  'ELEVENLABS_API_KEY',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'MINIMAX_API_KEY',
  'OPENAI_API_KEY',
  'OPENAI_BASE_URL',
  'OPENAI_ORG_ID',
  'OPENAI_PROJECT',
] as const

const savedEnv: Partial<Record<(typeof providerEnvKeys)[number], string>> = {}

beforeEach(() => {
  for (const key of providerEnvKeys) {
    savedEnv[key] = process.env[key]
    delete process.env[key]
  }
})

afterEach(() => {
  for (const key of providerEnvKeys) {
    const value = savedEnv[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
})

describe('resolveProviderConfig', () => {
  it('falls back to environment variables when provider config is absent', () => {
    process.env.OPENAI_API_KEY = 'env-openai-key'
    process.env.OPENAI_BASE_URL = 'https://env-openai.example/v1'
    process.env.OPENAI_ORG_ID = 'env-org'

    const resolved = resolveProviderConfig()

    expect(resolved.openai.apiKey).toBe('env-openai-key')
    expect(resolved.openai.baseURL).toBe('https://env-openai.example/v1')
    expect(resolved.openai.organization).toBe('env-org')
  })

  it('prefers explicit provider config over environment variables', () => {
    process.env.OPENAI_API_KEY = 'env-openai-key'
    process.env.OPENAI_BASE_URL = 'https://env-openai.example/v1'
    process.env.OPENAI_ORG_ID = 'env-org'

    const resolved = resolveProviderConfig({
      openai: {
        apiKey: 'config-openai-key',
        baseURL: 'https://config-openai.example/v1',
        orgId: 'config-org',
      },
    })

    expect(resolved.openai.apiKey).toBe('config-openai-key')
    expect(resolved.openai.baseURL).toBe('https://config-openai.example/v1')
    expect(resolved.openai.organization).toBe('config-org')
  })

  it('registers default models from provider config without env keys', () => {
    const models = getDefaultGenerationModels({
      anthropic: { apiKey: 'anthropic-key' },
      elevenLabs: { apiKey: 'elevenlabs-key' },
      google: { apiKey: 'google-key' },
      minimax: { apiKey: 'minimax-key' },
      openai: { apiKey: 'openai-key' },
    })

    expect(models.some((model) => model.id === 'Oai-text')).toBe(true)
    expect(models.some((model) => model.id === 'ANTH-C-text')).toBe(true)
    expect(models.some((model) => model.id === 'GEMINI-text')).toBe(true)
    expect(models.some((model) => model.id === '11Labs-m-v2')).toBe(true)
    expect(models.some((model) => model.id === 'MINIMAX-text')).toBe(true)
  })

  it('passes provider-configured defaults into generationModels callbacks', () => {
    const pluginConfig: PluginConfig = {
      collections: {},
      generationModels: (defaultModels) =>
        defaultModels.filter((model) => model.id === 'GEMINI-text'),
      providers: {
        google: { apiKey: 'google-key' },
      },
    }

    const models = getGenerationModels(pluginConfig)

    expect(models).toHaveLength(1)
    expect(models[0]?.id).toBe('GEMINI-text')
  })
})
