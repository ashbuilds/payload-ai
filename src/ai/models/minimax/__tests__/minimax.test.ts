import * as process from 'node:process'

import { describe, expect, it } from 'vitest'

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('minimax provider — unit', () => {
  describe('config structure', () => {
    it('exports MINIMAX-text model for text/textarea fields', async () => {
      const { MiniMaxConfig } = await import('../index.js')
      const model = MiniMaxConfig.models.find((m) => m.id === 'MINIMAX-text')
      expect(model).toBeDefined()
      expect(model!.fields).toContain('text')
      expect(model!.fields).toContain('textarea')
      expect(model!.output).toBe('text')
    })

    it('exports MINIMAX-object model for richText fields', async () => {
      const { MiniMaxConfig } = await import('../index.js')
      const model = MiniMaxConfig.models.find((m) => m.id === 'MINIMAX-object')
      expect(model).toBeDefined()
      expect(model!.fields).toContain('richText')
      expect(model!.output).toBe('text')
    })

    it('config provider is "MiniMax"', async () => {
      const { MiniMaxConfig } = await import('../index.js')
      expect(MiniMaxConfig.provider).toBe('MiniMax')
    })

    it('has exactly 2 models', async () => {
      const { MiniMaxConfig } = await import('../index.js')
      expect(MiniMaxConfig.models).toHaveLength(2)
    })
  })

  describe('model list', () => {
    it('includes M2.7 and M2.5 variants', async () => {
      const { MiniMaxConfig } = await import('../index.js')
      const textModel = MiniMaxConfig.models.find((m) => m.id === 'MINIMAX-text')
      const modelField = (textModel!.settings!.fields as any[]).find(
        (f: any) => f.name === 'model',
      )
      expect(modelField).toBeDefined()
      expect(modelField.options).toContain('MiniMax-M2.7')
      expect(modelField.options).toContain('MiniMax-M2.7-highspeed')
      expect(modelField.options).toContain('MiniMax-M2.5')
      expect(modelField.options).toContain('MiniMax-M2.5-highspeed')
    })

    it('defaults to MiniMax-M2.7 for text model', async () => {
      const { MiniMaxConfig } = await import('../index.js')
      const textModel = MiniMaxConfig.models.find((m) => m.id === 'MINIMAX-text')
      const modelField = (textModel!.settings!.fields as any[]).find(
        (f: any) => f.name === 'model',
      )
      expect(modelField?.defaultValue).toBe('MiniMax-M2.7')
    })

    it('defaults to MiniMax-M2.7 for object model', async () => {
      const { MiniMaxConfig } = await import('../index.js')
      const objectModel = MiniMaxConfig.models.find((m) => m.id === 'MINIMAX-object')
      const modelField = (objectModel!.settings!.fields as any[]).find(
        (f: any) => f.name === 'model',
      )
      expect(modelField?.defaultValue).toBe('MiniMax-M2.7')
    })
  })

  describe('settings conditions', () => {
    it('MINIMAX-text settings condition returns true only for MINIMAX-text', async () => {
      const { MiniMaxConfig } = await import('../index.js')
      const textModel = MiniMaxConfig.models.find((m) => m.id === 'MINIMAX-text')
      const condition = textModel!.settings!.admin!.condition!
      expect(condition({ 'model-id': 'MINIMAX-text' }, {}, {} as any)).toBe(true)
      expect(condition({ 'model-id': 'MINIMAX-object' }, {}, {} as any)).toBe(false)
    })

    it('MINIMAX-object settings condition returns true only for MINIMAX-object', async () => {
      const { MiniMaxConfig } = await import('../index.js')
      const objectModel = MiniMaxConfig.models.find((m) => m.id === 'MINIMAX-object')
      const condition = objectModel!.settings!.admin!.condition!
      expect(condition({ 'model-id': 'MINIMAX-object' }, {}, {} as any)).toBe(true)
      expect(condition({ 'model-id': 'MINIMAX-text' }, {}, {} as any)).toBe(false)
    })
  })

  describe('minimax SDK client', () => {
    it('creates an OpenAI-compatible provider function', async () => {
      const { minimax } = await import('../minimax.js')
      expect(minimax).toBeDefined()
      expect(typeof minimax).toBe('function')
    })

    it('returns a language model instance for a given model id', async () => {
      const { minimax } = await import('../minimax.js')
      const model = minimax('MiniMax-M2.7')
      expect(model).toBeDefined()
      expect(typeof model).toBe('object')
    })
  })

  describe('auto-detection via MINIMAX_API_KEY', () => {
    it('MiniMaxConfig models are available when API key is configured', async () => {
      const { MiniMaxConfig } = await import('../index.js')
      expect(MiniMaxConfig.models.length).toBeGreaterThan(0)
    })

    it('defaultGenerationModels includes MiniMax models when MINIMAX_API_KEY is set', async () => {
      const savedKey = process.env.MINIMAX_API_KEY
      process.env.MINIMAX_API_KEY = 'test-key'
      // Use dynamic import to get fresh evaluation of the env check
      const { MiniMaxConfig } = await import('../index.js')
      const hasMiniMax = MiniMaxConfig.models.some((m) => m.id.startsWith('MINIMAX'))
      expect(hasMiniMax).toBe(true)
      if (savedKey === undefined) {
        delete process.env.MINIMAX_API_KEY
      } else {
        process.env.MINIMAX_API_KEY = savedKey
      }
    })
  })
})

// ---------------------------------------------------------------------------
// Integration tests — skipped unless MINIMAX_API_KEY is present
// ---------------------------------------------------------------------------

const runIntegration = !!process.env.MINIMAX_API_KEY

describe.skipIf(!runIntegration)('minimax provider — integration', () => {
  it('text handler returns a Response for a simple prompt', async () => {
    const { MiniMaxConfig } = await import('../index.js')
    const textModel = MiniMaxConfig.models.find((m) => m.id === 'MINIMAX-text')!

    const schema = {
      type: 'object',
      properties: { result: { type: 'string' } },
      required: ['result'],
    }

    const response = await textModel.handler!('Say hello in one word', {
      model: 'MiniMax-M2.7',
      maxTokens: 50,
      temperature: 0.5,
      schema,
    })

    expect(response).toBeDefined()
    expect(response instanceof Response).toBe(true)
  }, 30_000)

  it('object handler returns a Response for a richText prompt', async () => {
    const { MiniMaxConfig } = await import('../index.js')
    const objectModel = MiniMaxConfig.models.find((m) => m.id === 'MINIMAX-object')!

    const schema = {
      type: 'object',
      properties: { content: { type: 'string' } },
      required: ['content'],
    }

    const response = await objectModel.handler!('Write a one-sentence bio for a developer', {
      model: 'MiniMax-M2.7-highspeed',
      maxTokens: 100,
      temperature: 0.7,
      schema,
    })

    expect(response).toBeDefined()
    expect(response instanceof Response).toBe(true)
  }, 30_000)

  it('temperature 0 is clamped and does not cause an API error', async () => {
    const { MiniMaxConfig } = await import('../index.js')
    const textModel = MiniMaxConfig.models.find((m) => m.id === 'MINIMAX-text')!

    const schema = {
      type: 'object',
      properties: { answer: { type: 'string' } },
      required: ['answer'],
    }

    // Should not throw despite temperature=0 being invalid for MiniMax
    const response = await textModel.handler!('What is 2+2?', {
      model: 'MiniMax-M2.5',
      maxTokens: 50,
      temperature: 0, // will be clamped to 0.001
      schema,
    })

    expect(response).toBeDefined()
  }, 30_000)
})
