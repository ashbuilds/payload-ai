import type { ImagesResponse } from 'openai/resources/images'

import OpenAI from 'openai'

import type { GenerateImageParams } from '../../../types.js'

import { editImagesWithOpenAI } from '../../utils/editImagesWithOpenAI.js'

export const generateImage = async (
  prompt: string,
  {
    images = [],
    size = '1024x1024',
    style = 'natural',
    version = 'dall-e-3',
  }: GenerateImageParams = {},
) => {
  const openaiAPI = new OpenAI()

  const options: Record<string, any> = {}
  if (version?.startsWith('dall')) {
    options['response_format'] = 'b64_json'
    options['style'] = style
  }

  let response: ImagesResponse
  const safeVersion = version ?? undefined
  if (images?.length) {
    response = await editImagesWithOpenAI(images, prompt, safeVersion)
  } else {
    response = await openaiAPI.images.generate({
      model: safeVersion,
      n: 1,
      prompt,
      size,
      ...options,
    })
  }

  const dataArr = response?.data ?? []
  const { b64_json, revised_prompt } = dataArr[0] || {}
  return {
    alt: revised_prompt,
    buffer: Buffer.from(b64_json ?? '', 'base64'),
  }
}
