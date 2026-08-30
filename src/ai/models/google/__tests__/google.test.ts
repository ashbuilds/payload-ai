import { describe, expect, it } from 'vitest'

const currentGeminiTextModels = [
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.1-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
]

const retiredGeminiModels = ['gemini-3-pro-preview', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']

type ModelField = {
  defaultValue?: string
  name?: string
  options?: string[]
}

describe('Google provider', () => {
  it('uses current supported Gemini text model IDs', async () => {
    const { GoogleConfig } = await import('../index.js')

    for (const modelID of ['GEMINI-text', 'GEMINI-object']) {
      const model = GoogleConfig.models.find((m) => m.id === modelID)
      const modelField = (model!.settings!.fields as ModelField[]).find(
        (field) => field.name === 'model',
      )

      expect(modelField?.defaultValue).toBe('gemini-3.7-flash')
      expect(modelField?.options).toEqual(currentGeminiTextModels)

      for (const retiredModel of retiredGeminiModels) {
        expect(modelField?.options).not.toContain(retiredModel)
      }
    }
  })
})
