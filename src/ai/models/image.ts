import type { ImagePart, ModelMessage } from 'ai'
import type { File } from 'payload'

import type { GenerationConfig } from '../../types.js'

import { getImageModel } from '../providers/index.js'
import { generateFileNameByPrompt } from '../utils/generateFileNameByPrompt.js'

interface ImageGenerationResult {
  data: {
    alt: string
  }
  file: File
}

interface MultimodalImageFile {
  base64Data?: string
  mediaType?: string
  uint8Array?: Uint8Array
}

function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/bmp': 'bmp',
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/tiff': 'tiff',
    'image/webp': 'webp',
  }

  return mimeToExt[mimeType.toLowerCase()] || 'png'
}

/**
 * Convert base64 or Uint8Array to Buffer
 */
function convertToBuffer(imageData: string | Uint8Array): Buffer {
  if (typeof imageData === 'string') {
    return Buffer.from(imageData, 'base64')
  }
  return Buffer.from(imageData)
}

/**
 * Create a PayloadFile from image data
 */
function createPayloadFile(
  imageData: string | Uint8Array,
  prompt: string,
  mimeType: string = 'image/png',
): ImageGenerationResult {
  const buffer = convertToBuffer(imageData)
  const extension = getExtensionFromMimeType(mimeType)
  const fileName = `${generateFileNameByPrompt(prompt)}.${extension}`

  return {
    data: {
      alt: prompt,
    },
    file: {
      name: fileName,
      data: buffer,
      mimetype: mimeType,
      size: buffer.byteLength,
    },
  }
}

/**
 * Handle multimodal-text image generation (Nano Banana models)
 */
async function handleMultimodalTextGeneration(
  model: any,
  prompt: string,
  images: ImagePart[] = [],
): Promise<ImageGenerationResult> {
  const { generateText } = await import('ai')

  // const imageParts = images.map((img) => ({
  //   type: 'image' as const,
  //   image: img.data,
  //   mimeType: img.mimeType,
  // }))

  const promptParts: ModelMessage['content'] = [
    {
      type: 'text' as const,
      text: prompt,
    },
    ...images,
  ]

  const messages: ModelMessage[] = [
    {
      content: promptParts,
      role: 'user',
    },
  ]

  const result = await generateText({
    model,
    prompt: messages,
    providerOptions: {
      google: {
        imageConfig: {
          aspectRatio: '16:9',
        },
        responseModalities: ['IMAGE', 'TEXT'],
      },
    },
  })

  // Extract images from result.files
  const resultImages = (result.files?.filter((f: MultimodalImageFile) =>
    f.mediaType?.startsWith('image/'),
  ) || []) as MultimodalImageFile[]

  if (resultImages.length === 0) {
    throw new Error('No images returned from the model. The model may have generated only text.')
  }

  const firstImage = resultImages[0]
  const mimeType = firstImage.mediaType || 'image/png'

  // Handle both base64Data and uint8Array formats
  const imageData = firstImage.base64Data || firstImage.uint8Array

  if (!imageData) {
    throw new Error('Image data is missing from the response.')
  }

  return createPayloadFile(imageData, prompt, mimeType)
}

/**
 * Handle standard image generation (Imagen, DALL-E, etc.)
 */
async function handleStandardImageGeneration(
  model: any,
  prompt: string,
): Promise<ImageGenerationResult> {
  const { experimental_generateImage } = await import('ai')

  const { image } = await experimental_generateImage({
    model,
    n: 1,
    prompt,
  })

  // experimental_generateImage returns base64 and mimeType
  return createPayloadFile(image.base64, prompt, image.mediaType || 'image/png')
}

export const ImageConfig: GenerationConfig = {
  models: [
    {
      id: 'image',
      name: 'Image Generation',
      fields: ['upload'],
      handler: async (prompt: string, options: any): Promise<ImageGenerationResult> => {
        const { images = [], req } = options

        if (!prompt || !prompt.trim()) {
          throw new Error(
            'Prompt is required for image generation. Please ensure your Instruction has a prompt template.',
          )
        }

        // Determine generation method by checking the model metadata
        const { getProviderRegistry } = await import('../providers/index.js')
        const registry = await getProviderRegistry(req.payload)
        console.log('options.provider', options.provider)
        const provider = registry[options.provider]
        console.log('provider ', provider)
        const modelConfig = provider?.models?.find((m: any) => m.id === options.model)

        console.log('modelConfig', modelConfig)
        // Determine generation approach based on responseModalities
        // If the model supports IMAGE in responseModalities, use multimodal approach
        const isMultimodalText = modelConfig?.responseModalities?.includes('IMAGE') ?? false
        console.log('isMultimodalText', isMultimodalText)

        // Get the model instance
        const model = await getImageModel(
          req.payload,
          options.provider,
          options.model,
          isMultimodalText,
        )
        console.log('model', model)

        // Route based on generation method
        if (isMultimodalText) {
          return handleMultimodalTextGeneration(model, prompt, images)
        } else {
          return handleStandardImageGeneration(model, prompt)
        }
      },
      output: 'image',
      settings: {
        name: 'image-settings',
        type: 'group',
        admin: {
          condition(data: any) {
            return data['model-id'] === 'image'
          },
        },
        fields: [
          {
            name: 'provider',
            type: 'text',
            admin: {
              components: {
                Field: '@ai-stack/payloadcms/client#DynamicProviderSelect',
              },
            },
            defaultValue: 'openai',
            label: 'Provider',
          },
          {
            name: 'model',
            type: 'text',
            admin: {
              components: {
                Field: '@ai-stack/payloadcms/client#DynamicModelSelect',
              },
            },
            defaultValue: 'dall-e-3',
            label: 'Model',
          },
        ],
        label: 'Image Settings',
      },
    },
  ],
  provider: 'Multi-Provider',
}
