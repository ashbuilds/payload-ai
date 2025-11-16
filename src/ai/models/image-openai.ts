import type { File } from 'payload'

import type { GenerationConfig } from '../../types.js'

import { generateFileNameByPrompt } from '../utils/generateFileNameByPrompt.js'
import { generateImage } from './openai/generateImage.js'

type Engine = 'dall-e-3' | 'gpt-image-1'

type ImageOptions = {
  engine: Engine
  images?: Array<{ data: Blob; name: string; size: number; type: string; url: string }>
  size?:
    | '256x256'
    | '512x512'
    | '1024x1024'
    | '1024x1536'
    | '1024x1792'
    | '1536x1024'
    | '1792x1024'
    | 'auto'
  style?: 'auto' | 'natural' | 'vivid'
}

export const OpenAIImageConfig: GenerationConfig = {
  models: [
    {
      id: 'image-openai',
      name: 'OpenAI Image',
      fields: ['upload'],
      handler: async (prompt: string, options: ImageOptions) => {
        // Route to existing OpenAI image adapter with a unified option shape.
        const result = await generateImage(prompt, {
          images: options.images,
          size: options.size === 'auto' ? '1024x1024' : options.size, // fallback for gpt-image-1
          style: options.style === 'auto' ? 'natural' : options.style,
          version: options.engine,
        })

        return {
          data: {
            alt: result.alt || prompt,
          },
          file: {
            name: `image_${generateFileNameByPrompt(result.alt || prompt)}.${options.engine === 'gpt-image-1' ? 'png' : 'jpeg'}`,
            data: result.buffer,
            mimetype: options.engine === 'gpt-image-1' ? 'image/png' : 'image/jpeg',
            size: result.buffer.byteLength,
          } as File,
        }
      },
      output: 'image',
      settings: {
        name: 'image-openai-settings',
        type: 'group',
        admin: {
          condition(data) {
            return data['model-id'] === 'image-openai'
          },
        },
        fields: [
          {
            name: 'engine',
            type: 'select',
            defaultValue: 'gpt-image-1',
            label: 'Engine',
            options: ['gpt-image-1', 'dall-e-3'],
          },
          {
            type: 'row',
            fields: [
              {
                name: 'size',
                type: 'select',
                defaultValue: '1024x1024',
                label: 'Size',
                options: [
                  '256x256',
                  '512x512',
                  '1024x1024',
                  '1024x1536',
                  '1536x1024',
                  '1792x1024',
                  '1024x1792',
                  'auto',
                ],
              },
              {
                name: 'style',
                type: 'select',
                defaultValue: 'natural',
                label: 'Style',
                options: ['vivid', 'natural', 'auto'],
              },
            ],
          },
        ],
        label: 'OpenAI Image Settings',
      },
    },
  ],
  provider: 'OpenAI',
}
