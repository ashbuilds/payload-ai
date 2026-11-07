import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

// Exercise the exact transitive dependency loaded by Payload, including the pnpm patch.
const require = createRequire(import.meta.url)
const payloadRequire = createRequire(require.resolve('payload'))
const merge = payloadRequire('deepmerge')
const malicious = () => JSON.parse('{"__proto__":{"isAdmin":true},"safe":"kept"}')

const expectSafe = (result: Record<string, unknown>) => {
  expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
  expect(result.isAdmin).toBeUndefined()
  expect(Object.hasOwn(result, '__proto__')).toBe(false)
  expect(result.safe).toBe('kept')
}

describe('deepmerge prototype poisoning regression (GHSA-gcqx-w48m-w2h4)', () => {
  it('rejects source prototype keys with a null-prototype target', () => {
    expectSafe(merge(Object.create(null), malicious()))
  })

  it.each([null, undefined, 0, false, ''])('rejects nested prototype keys over %s', (value) => {
    expectSafe(merge({ session: value }, { session: malicious() }).session)
  })

  it('rejects prototype keys copied from the target', () => {
    expectSafe(merge(malicious(), {}))
  })

  it('rejects prototype keys when both inputs own that key', () => {
    expectSafe(merge(malicious(), malicious()))
  })

  it('rejects prototype keys inside arrays and merge.all', () => {
    expectSafe(merge([], [malicious()])[0])
    expectSafe(merge.all([malicious(), { other: true }]))
  })

  it('preserves nested config, symbols, array merging, and custom merge callbacks', () => {
    const symbol = Symbol('config')
    const target = { fields: ['title'], nested: { enabled: true }, [symbol]: { a: 1 } }
    const source = { fields: ['body'], nested: { locale: 'en' }, [symbol]: { b: 2 } }
    expect(merge(target, source)).toEqual({
      fields: ['title', 'body'],
      nested: { enabled: true, locale: 'en' },
      [symbol]: { a: 1, b: 2 },
    })
    expect(
      merge(target, source, { arrayMerge: (_target: unknown, value: unknown) => value }).fields,
    ).toEqual(['body'])
    expect(
      merge(target, source, {
        customMerge: (key: string) => (key === 'nested' ? () => ({ custom: true }) : undefined),
      }).nested,
    ).toEqual({ custom: true })
    expect(target.fields).toEqual(['title'])
    expect(({} as Record<string, unknown>).isAdmin).toBeUndefined()
  })
})
