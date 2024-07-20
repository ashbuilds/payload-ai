import type { ImageGenerateParams } from 'openai/resources/images'

import OpenAI from 'openai'

export const generateImage = async (
  prompt: string,
  {
    size = '1024x1024',
    style = 'natural',
    version = 'dall-e-3',
  }: {
    size?: ImageGenerateParams['size']
    style?: ImageGenerateParams['style']
    version?: ImageGenerateParams['model']
  } = {},
) => {
  const openaiAPI = new OpenAI()
  console.log('generateImage: ', size, style, version, prompt)
  const response = await openaiAPI.images.generate({
    model: version,
    n: 1,
    prompt,
    response_format: 'b64_json',
    size,
    style,
  })

  const { b64_json, revised_prompt } = response.data[0] || {}
  return {
    alt: revised_prompt,
    buffer: Buffer.from(b64_json, 'base64'),
  }
}
