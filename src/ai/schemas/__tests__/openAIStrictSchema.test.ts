import { describe, expect, it } from 'vitest'

import { documentSchema } from '../lexicalJsonSchema.js'

const collectMissingRequiredFields = (schema: unknown, path = '#'): string[] => {
  if (!schema || typeof schema !== 'object') {
    return []
  }

  const currentSchema = schema as {
    definitions?: Record<string, unknown>
    properties?: Record<string, unknown>
    required?: string[]
    type?: string
  }

  const missingFields: string[] = []

  if (currentSchema.type === 'object' && currentSchema.properties) {
    const required = new Set(currentSchema.required ?? [])

    Object.keys(currentSchema.properties).forEach((propertyName) => {
      if (!required.has(propertyName)) {
        missingFields.push(`${path}: ${propertyName}`)
      }
    })
  }

  Object.entries(currentSchema.definitions ?? {}).forEach(([definitionName, definitionSchema]) => {
    missingFields.push(
      ...collectMissingRequiredFields(definitionSchema, `#/definitions/${definitionName}`),
    )
  })

  Object.entries(currentSchema.properties ?? {}).forEach(([propertyName, propertySchema]) => {
    missingFields.push(...collectMissingRequiredFields(propertySchema, `${path}.${propertyName}`))
  })

  return missingFields
}

describe('documentSchema OpenAI strict compatibility', () => {
  it('marks every object property as required', () => {
    expect(collectMissingRequiredFields(documentSchema)).toEqual([])
  })
})
