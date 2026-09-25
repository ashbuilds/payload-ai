import { MockLanguageModelV3 } from 'ai/test'
import { afterEach, expect, it, vi } from 'vitest'

import { generateObject } from '../generateObject.js'

// Run the actual SDK conversion/download path; replace only the network boundary
// and AI provider. No external service or private network is contacted.
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

it('does not download prompt URLs when no storage resolver is configured', async () => {
  const fetch = vi.fn(() =>
    Promise.resolve(
      new Response('harmless-image', {
        headers: { 'content-type': 'image/png' },
      }),
    ),
  )
  vi.stubGlobal('fetch', fetch)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const model = makeModel()
  try {
    const response = await generateObject(
      'Describe https://untrusted.example/photo.png',
      {
        extractAttachments: true,
        schema: { type: 'object', properties: { text: { type: 'string' } } },
      },
      model,
    )
    await response.text()
  } catch {
    /* Either a preflight rejection or stream failure is acceptable here. */
  }
  expect(fetch).not.toHaveBeenCalled()
  expect(model.doStreamCalls).toHaveLength(0)
})

function makeModel(supportsURLs = false) {
  return new MockLanguageModelV3({
    doStream: {
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({ id: '1', type: 'text-start' })
          controller.enqueue({ id: '1', type: 'text-delta', delta: '{"text":"ok"}' })
          controller.enqueue({ id: '1', type: 'text-end' })
          controller.enqueue({
            type: 'finish',
            finishReason: { raw: 'stop', unified: 'stop' },
            usage: {
              inputTokens: { cacheRead: 0, cacheWrite: 0, noCache: 1, total: 1 },
              outputTokens: { reasoning: 0, text: 1, total: 1 },
            },
          })
          controller.close()
        },
      }),
    },
    supportedUrls: supportsURLs ? { 'image/*': [/^https:/] } : {},
  })
}

it.each([false, true])(
  'passes bytes, never attachment URLs, to the SDK (provider URL support: %s)',
  async (supportsURLs) => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const model = makeModel(supportsURLs)
    const resolvePromptImage = vi.fn(() =>
      Promise.resolve(new Blob(['approved-image'], { type: 'image/png' })),
    )
    const response = await generateObject(
      'Describe https://untrusted.example/photo.png',
      {
        extractAttachments: true,
        resolvePromptImage,
        schema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] },
      },
      model,
    )
    expect(await response.text()).toContain('ok')
    expect(resolvePromptImage).toHaveBeenCalledWith('https://untrusted.example/photo.png')
    expect(fetch).not.toHaveBeenCalled()
    const file = model.doStreamCalls[0].prompt
      .flatMap((message) => (message.role === 'user' ? message.content : []))
      .find((part) => part.type === 'file')
    expect(file).toMatchObject({ type: 'file', mediaType: 'image/png' })
    expect(file && 'data' in file && file.data).toBeInstanceOf(Uint8Array)
  },
)

it('stops before invoking the SDK when the storage resolver denies a source', async () => {
  const model = makeModel()
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  await expect(
    generateObject(
      'Describe https://untrusted.example/photo.png',
      {
        extractAttachments: true,
        resolvePromptImage: () => Promise.reject(new Error('Source denied')),
      },
      model,
    ),
  ).rejects.toThrow('Source denied')
  expect(fetch).not.toHaveBeenCalled()
  expect(model.doStreamCalls).toHaveLength(0)
})

it('leaves URLs as text when attachment extraction is disabled', async () => {
  const model = makeModel()
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  const response = await generateObject(
    'Describe https://untrusted.example/photo.png',
    {
      schema: { type: 'object', properties: { text: { type: 'string' } } },
    },
    model,
  )
  expect(await response.text()).toContain('ok')
  expect(fetch).not.toHaveBeenCalled()
})
