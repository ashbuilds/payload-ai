import type { Payload } from 'payload'

import config from '@payload-config'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

let payload: Payload

afterAll(async () => {
  await payload.destroy()
})

beforeAll(async () => {
  payload = await getPayload({ config })
})

describe('Plugin integration tests', () => {
  test('should have AI plugin collections registered', () => {
    expect(payload.collections['ai-instructions']).toBeDefined()
    expect(payload.collections['ai-jobs']).toBeDefined()
  })

  test('should have payload.ai augmentation available', () => {
    expect(payload.ai).toBeDefined()
    expect(payload.ai.generateObject).toBeTypeOf('function')
    expect(payload.ai.generateText).toBeTypeOf('function')
    expect(payload.ai.generateMedia).toBeTypeOf('function')
  })
})
