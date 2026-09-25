import type { PayloadRequest } from 'payload'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type { PluginConfig } from '../../types.js'

import { resolveReferenceImage as loadReferenceImage } from '../resolveReferenceImage.js'

const image = () => new Blob(['test-image'], { type: 'image/png' })
const setup = () => {
  const findByID = vi.fn().mockResolvedValue({ id: 7, filename: 'sample.png' })
  const request = { payload: { findByID } } as unknown as PayloadRequest
  const resolveReferenceImage = vi.fn().mockImplementation(() => Promise.resolve(image()))
  const config: PluginConfig = { collections: {}, resolveReferenceImage }
  return { config, findByID, request, resolveReferenceImage }
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('deployment-owned reference image resolution', () => {
  it('makes no network request when no resolver is configured', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const { request } = setup()
    await expect(
      loadReferenceImage({ kind: 'url', url: 'https://example.test/image.png' }, request, {
        collections: {},
      }),
    ).rejects.toThrow('configured')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('checks media permissions before giving the resolver an authorized document', async () => {
    const { config, findByID, request, resolveReferenceImage } = setup()
    config.uploadCollectionSlug = 'assets'
    const result = await loadReferenceImage({ id: 7, kind: 'media' }, request, config)
    expect(findByID).toHaveBeenCalledWith({
      id: 7,
      collection: 'assets',
      depth: 0,
      overrideAccess: false,
      req: request,
    })
    expect(resolveReferenceImage.mock.calls[0][0].source).toEqual({
      collection: 'assets',
      document: { id: 7, filename: 'sample.png' },
      kind: 'media',
    })
    expect(result.data).toBeInstanceOf(Blob)
    expect(result.size).toBe(10)
  })

  it('stops before resolving bytes when media access is denied', async () => {
    const { config, findByID, request, resolveReferenceImage } = setup()
    findByID.mockRejectedValue(new Error('Forbidden'))
    await expect(loadReferenceImage({ id: 7, kind: 'media' }, request, config)).rejects.toThrow(
      'Forbidden',
    )
    expect(resolveReferenceImage).not.toHaveBeenCalled()
  })

  it('rejects missing or populated objects as media IDs', async () => {
    const { config, findByID, request } = setup()
    for (const id of [null, undefined, { id: 7 }]) {
      await expect(loadReferenceImage({ id, kind: 'media' }, request, config)).rejects.toThrow(
        'Invalid',
      )
    }
    expect(findByID).not.toHaveBeenCalled()
  })

  it('leaves URL approval to the resolver without fetching or forwarding credentials', async () => {
    const { config, request, resolveReferenceImage } = setup()
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    resolveReferenceImage.mockRejectedValue(new Error('Unsupported source'))
    await expect(
      loadReferenceImage({ kind: 'url', url: '/image.png' }, request, config),
    ).rejects.toThrow('Unsupported source')
    expect(fetch).not.toHaveBeenCalled()
    expect(resolveReferenceImage.mock.calls[0][0].source).toEqual({
      kind: 'url',
      url: '/image.png',
    })
  })

  it.each([
    new Blob([], { type: 'image/png' }),
    new Blob(['html'], { type: 'text/html' }),
    new Blob([new Uint8Array(20 * 1024 * 1024 + 1)], { type: 'image/png' }),
  ])('rejects invalid or oversized resolver output', async (blob) => {
    const { config, request, resolveReferenceImage } = setup()
    resolveReferenceImage.mockResolvedValue(blob)
    await expect(loadReferenceImage({ id: 7, kind: 'media' }, request, config)).rejects.toThrow()
  })

  it('times out and signals cancellation to a stalled resolver', async () => {
    vi.useFakeTimers()
    const { config, request, resolveReferenceImage } = setup()
    resolveReferenceImage.mockImplementation(() => new Promise(() => {}))
    const operation = loadReferenceImage({ kind: 'url', url: '/image.png' }, request, config)
    const assertion = expect(operation).rejects.toThrow('timed out')
    await vi.advanceTimersByTimeAsync(30_000)
    await assertion
    expect(resolveReferenceImage.mock.calls[0][0].signal.aborted).toBe(true)
  })
})
