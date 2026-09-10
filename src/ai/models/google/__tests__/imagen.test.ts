import { beforeEach, describe, expect, it, vi } from 'vitest'

const generateImages = vi.fn()
const providerConfig = {
  apiKey: 'google-key',
  baseURL: undefined,
  headers: undefined,
}

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn(function () {
    return {
      models: {
        generateImages,
      },
    }
  }),
}))

describe('Google Imagen', () => {
  beforeEach(() => {
    generateImages.mockReset()
  })

  it('returns the selected output MIME type from generateImage', async () => {
    generateImages.mockResolvedValue({
      generatedImages: [
        {
          enhancedPrompt: 'A refined test prompt',
          image: {
            imageBytes: Buffer.from('jpeg-bytes').toString('base64'),
          },
        },
      ],
    })

    const { generateImage } = await import('../generateImage.js')
    const result = await generateImage('A test prompt', {
      outputMimeType: 'image/jpeg',
      providerConfig,
    })

    expect(result.outputMimeType).toBe('image/jpeg')
    expect(result.buffer).toEqual(Buffer.from('jpeg-bytes'))
    expect(generateImages).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          outputMimeType: 'image/jpeg',
        }),
      }),
    )
  })

  it('rejects unsupported output MIME types before requesting an image', async () => {
    const { generateImage } = await import('../generateImage.js')

    await expect(
      generateImage('A test prompt', {
        outputMimeType: 'image/webp',
        providerConfig,
      }),
    ).rejects.toThrow('Unsupported Imagen output MIME type: image/webp')

    expect(generateImages).not.toHaveBeenCalled()
  })

  it('labels JPEG uploads with JPEG metadata', async () => {
    generateImages.mockResolvedValue({
      generatedImages: [
        {
          enhancedPrompt: 'A refined test prompt',
          image: {
            imageBytes: Buffer.from('jpeg-bytes').toString('base64'),
          },
        },
      ],
    })

    const { createGoogleConfig } = await import('../index.js')
    const config = createGoogleConfig(providerConfig)
    const model = config.models.find((m) => m.id === 'imagen')!
    const result = await model.handler!('A test prompt', {
      outputMimeType: 'image/jpeg',
    })

    expect(result.file.name).toMatch(/^image_a_refined_test_prompt_\d{8}T\d{9}Z\.jpeg$/)
    expect(result.file.mimetype).toBe('image/jpeg')
    expect(result.file.data).toEqual(Buffer.from('jpeg-bytes'))
    expect(result.file.size).toBe(Buffer.byteLength('jpeg-bytes'))
  })
})
