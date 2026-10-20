import { afterEach, expect, it, vi } from 'vitest'

import { resolveProviderConfig } from '../../../providers/resolveProviderConfig.js'
import { editImagesWithOpenAI } from '../../../utils/editImagesWithOpenAI.js'
import { generateImage } from '../generateImage.js'
import { createOpenAIConfig } from '../index.js'

const providerConfig = resolveProviderConfig({
  openai: { apiKey: 'test-key', baseURL: 'https://images.example/v1' },
}).openai
const images = [
  {
    name: 'reference',
    type: 'image/png',
    data: new Blob(['image'], { type: 'image/png' }),
    size: 5,
    url: 'https://storage.example/reference.png',
  },
]

afterEach(() => vi.unstubAllGlobals())

function mockImageResponse() {
  const fetch = vi.fn(() =>
    Promise.resolve(
      Response.json({ data: [{ b64_json: Buffer.from('png-bytes').toString('base64') }] }),
    ),
  )
  vi.stubGlobal('fetch', fetch)
  return fetch
}

it.each([
  ['gpt-image-1', 'gpt-image-2.5-sunburst'],
  ['gpt-image-2.5-sunburst', 'gpt-image-2.5-sunburst'],
  ['gpt-image-2.5-flare', 'gpt-image-2.5-flare'],
  ['custom-image-model', 'custom-image-model'],
])('generates with %s resolved to %s', async (version, expectedModel) => {
  const fetch = mockImageResponse()
  const result = await generateImage('A landscape', { providerConfig, version })
  const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
  expect(JSON.parse(init.body as string)).toMatchObject({ model: expectedModel })
  expect(result.buffer).toEqual(Buffer.from('png-bytes'))
})

it.each([undefined, 'gpt-image-1', 'gpt-image-2.5-flare', 'custom-image-model'])(
  'edits with the default, saved legacy, or explicit model: %s',
  async (version) => {
    const fetch = mockImageResponse()
    await editImagesWithOpenAI(images, 'Edit this', version, providerConfig)
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://images.example/v1/images/edits')
    const body = init.body as FormData
    expect(body.get('model')).toBe(
      !version || version === 'gpt-image-1' ? 'gpt-image-2.5-sunburst' : version,
    )
    expect(body.getAll('image[]')).toHaveLength(1)
  },
)

it.each([[], images])(
  'uses Sunburst for saved GPT Image instructions without a version',
  async (references) => {
    const fetch = mockImageResponse()
    const model = createOpenAIConfig(providerConfig).models.find(({ id }) => id === 'gpt-image-1')!
    expect(model.settings).toMatchObject({
      name: 'gpt-image-1-settings',
      fields: expect.arrayContaining([
        expect.objectContaining({ name: 'version', defaultValue: 'gpt-image-2.5-sunburst' }),
      ]),
    })
    await model.handler!('A landscape', { images: references })
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    const modelSent =
      init.body instanceof FormData ? init.body.get('model') : JSON.parse(init.body as string).model
    expect(modelSent).toBe('gpt-image-2.5-sunburst')
  },
)
