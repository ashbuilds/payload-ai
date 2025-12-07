import { experimental_generateImage, generateText } from 'ai'

import type { MediaResult, MultimodalImageFile, PayloadGenerateMediaArgs } from './types.js'

import { getImageModel, getProviderRegistry } from '../providers/registry.js'

/**
 * Helper to get file extension from MIME type
 */
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
 * Helper to convert image data to Buffer
 */
function convertToBuffer(imageData: string | Uint8Array): Buffer {
  if (typeof imageData === 'string') {
    return Buffer.from(imageData, 'base64')
  }
  return Buffer.from(imageData)
}

/**
 * Handle multimodal-text image generation (e.g., Gemini Nano Banana)
 */
async function handleMultimodalTextGeneration(
  model: any,
  prompt: string,
  images: any[] = [],
): Promise<MediaResult> {
  const promptParts: any[] = [
    { type: 'text' as const, text: prompt },
    ...images,
  ]

  const messages: any[] = [
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
  const imageData = firstImage.base64Data || firstImage.uint8Array

  if (!imageData) {
    throw new Error('Image data is missing from the response.')
  }

  const buffer = convertToBuffer(imageData)
  const extension = getExtensionFromMimeType(mimeType)

  return {
    file: {
      name: `generated.${extension}`,
      data: buffer,
      mimetype: mimeType,
      size: buffer.byteLength,
    },
  }
}

/**
 * Handle standard image generation (DALL-E, Imagen, etc.)
 */
async function handleStandardImageGeneration(
  model: any,
  prompt: string,
  options: Pick<PayloadGenerateMediaArgs, 'n' | 'providerOptions'>,
): Promise<MediaResult> {
  // Standard image generation (DALL-E, Imagen, etc.)
  const generateResult = await experimental_generateImage({
    model,
    n: options.n || 1,
    prompt,
  })

  const { image } = generateResult

  const buffer = Buffer.from(image.base64, 'base64')
  const mimeType = image.mediaType || 'image/png'
  const extension = getExtensionFromMimeType(mimeType)

  return {
    file: {
      name: `generated.${extension}`,
      data: buffer,
      mimetype: mimeType,
      size: buffer.byteLength,
    },
  }
}

/**
 * Handle async video generation via Fal
 * Note: This logic will be revisited later as per user request
 */
async function handleFalVideoGeneration(
  args: PayloadGenerateMediaArgs,
): Promise<MediaResult> {
  // For now, use the existing video generation logic from video.ts
  // This will be refactored later with the job scheduling improvements
  const { VideoConfig } = await import('../models/video.js')
  const videoModel = VideoConfig.models[0]
  
  if (!videoModel.handler) {
    throw new Error('Video handler not found')
  }

  const result = await videoModel.handler(args.prompt, {
    ...args,
    req: { payload: args.payload },
  } as any)

  return {
    jobId: result.jobId,
    progress: result.progress ?? 0,
    status: result.status || 'queued',
    taskId: result.taskId,
  }
}

/**
 * Unified media generation handler
 * Automatically detects generation method based on model configuration
 */
export async function generateMedia(args: PayloadGenerateMediaArgs): Promise<MediaResult> {
  const { images = [], model: modelId, payload, prompt, provider, ...options } = args

  if (!prompt || !prompt.trim()) {
    throw new Error(
      'Prompt is required for media generation. Please ensure your Instruction has a prompt template.',
    )
  }

  // Get provider registry and model configuration
  const registry = await getProviderRegistry(payload)
  const providerConfig = registry[provider || '']

  if (!providerConfig) {
    throw new Error(`Provider ${provider} not found in registry`)
  }

  const modelConfig = providerConfig.models?.find((m: any) => m.id === modelId)

  if (!modelConfig) {
    throw new Error(`Model ${modelId} not found in provider ${provider}`)
  }

  // Check if this is video generation (async)
  if (providerConfig.id === 'fal' && modelConfig.useCase === 'video') {
    return handleFalVideoGeneration(args)
  }

  // Determine if this is multimodal text-to-image
  const isMultimodalText = modelConfig.responseModalities?.includes('IMAGE') ?? false

  // Get the model instance
  const model = await getImageModel(payload, provider, modelId, isMultimodalText)

  // Route to appropriate handler
  if (isMultimodalText) {
    return handleMultimodalTextGeneration(model, prompt, images)
  } else {
    return handleStandardImageGeneration(model, prompt, options)
  }
}
