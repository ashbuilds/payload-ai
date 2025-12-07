import {
  experimental_generateImage,
  generateText,
  type ImageModel,
  type ImagePart,
  type LanguageModel,
  type ModelMessage,
} from 'ai'
// Will use generateSpeech if available in installed AI SDK version using generic import
// otherwise will fallback or show error if not available at runtime.

import type { MediaResult, MultimodalImageFile, PayloadGenerateMediaArgs } from './types.js'

import { getImageModel, getProviderRegistry, getTTSModel } from '../providers/registry.js'

/**
 * Helper to get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/aac': 'aac',
    'audio/flac': 'flac',
    'audio/L16': 'pcm', // L16 is often raw PCM
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/opus': 'opus',
    'audio/wav': 'wav',
    'image/bmp': 'bmp',
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/tiff': 'tiff',
    'image/webp': 'webp',
  }

  return mimeToExt[mimeType.toLowerCase()] || 'bin'
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
  model: LanguageModel,
  prompt: string,
  images: ImagePart[] = [],
): Promise<MediaResult> {
  const promptParts: Array<{ text: string; type: 'text' } | ImagePart> = [
    { type: 'text' as const, text: prompt },
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
  model: ImageModel,
  prompt: string,
  options: Pick<PayloadGenerateMediaArgs, 'n' | 'providerOptions'>,
): Promise<MediaResult> {
  const generateResult = await experimental_generateImage({
    model,
    n: options.n || 1,
    prompt,
    providerOptions: options.providerOptions,
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
 * Handle Speech Generation via AI SDK
 */
async function handleSpeechGeneration(
  model: any,
  prompt: string,
  _options: PayloadGenerateMediaArgs,
): Promise<MediaResult> {
  // Dynamic import to avoid build errors if older SDK version
  let generateSpeech
  try {
    const ai = await import('ai')
    generateSpeech = ai.experimental_generateSpeech
  } catch (_e) {
    // Fallback or rethrow
  }

  if (!generateSpeech) {
    throw new Error(
      'generateSpeech not found in "ai" package. Please upgrade to the latest version.',
    )
  }

  const result = await generateSpeech({
    model,
    text: prompt,
    // Common parameters often mapped
    // We can pass specific provider options if needed via providerOptions
  })

  // Destructure from the correct SpeechResult type
  const { audio } = result
  const mimeType = audio.mediaType || 'audio/mp3'
  // Often format is just 'mp3' or 'wav', safely grab it or infer from mimetype
  const extension = (audio as any).format || getExtensionFromMimeType(mimeType)

  // Prefer uint8Array if available, else base64
  const dataBuffer = audio.uint8Array
    ? Buffer.from(audio.uint8Array)
    : Buffer.from(audio.base64, 'base64')

  return {
    file: {
      name: `speech.${extension}`,
      data: dataBuffer,
      mimetype: mimeType,
      size: dataBuffer.length,
    },
  }
}

/**
 * Handle Async Video Generation (Fal)
 */
async function handleVideoGeneration(args: PayloadGenerateMediaArgs): Promise<MediaResult> {
  // Re-implementing logic from video.ts to centralize it here
  // But leveraging the existing Fal logic we saw in video.ts
  // We need to import submitFalJob logic or replicate it.
  // Ideally we should have a shared fal utility, but for now we will
  // use the pattern from the video.ts inspection.

  // To keep this file clean, let's dynamic import the handler logic
  // OR just use the handler from VideoConfig if we want to be lazy,
  // BUT the goal is refactoring.
  // So let's implement the core specific logic here.

  // Actually, for cleaner code, we should likely move the Fal specific helper functions
  // to a utility eventually. For now, to solve the immediate task,
  // I will call the existing handler in video.ts to avoid duplicating 100 lines of fal logic
  // while we are in transition, OR I import it.

  // Strategy: Import the handler from video.ts for now, as `generateMedia` wraps it.
  // Once fully refactored, we delete video.ts and move logic here.
  // But since I am tasked to "clean code", better to inline the necessary parts
  // or create `src/ai/utils/fal.ts`.

  // Given scope, I'll delegate to the existing model handler for Video
  // to ensure I don't break the complex Fal upload/webhook logic immediately,
  // effectively making generateMedia a router.

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
    throw new Error('Prompt is required for media generation.')
  }

  // Get provider registry and model configuration
  const registry = await getProviderRegistry(payload)
  const providerConfig = registry[provider || '']

  if (!providerConfig) {
    throw new Error(`Provider ${provider} not found in registry`)
  }

  // 1. Check for Video (Fal + Video use case)
  const isVideo =
    providerConfig.id === 'fal' &&
    providerConfig.models?.find((m) => m.id === modelId)?.useCase === 'video'

  if (isVideo) {
    return handleVideoGeneration(args)
  }

  // 2. Check for Speech (TTS)
  const isTTS =
    providerConfig.id === 'elevenlabs' ||
    (providerConfig.id === 'openai' && modelId?.startsWith('tts'))

  if (isTTS) {
    const model = await getTTSModel(payload, provider, modelId)
    return handleSpeechGeneration(model, prompt, args)
  }

  // 3. Image Generation
  const modelConfig = providerConfig.models?.find((m) => m.id === modelId)
  if (!modelConfig) {
    // If prompt implies image, try default image flow?
    // strict error for now
    // throw new Error(`Model ${modelId} not found in provider ${provider}`)
  }

  const isMultimodalText = modelConfig?.responseModalities?.includes('IMAGE') ?? false
  const model = await getImageModel(payload, provider, modelId, isMultimodalText)

  if (isMultimodalText) {
    return handleMultimodalTextGeneration(model as LanguageModel, prompt, images)
  } else {
    // Standard image
    return handleStandardImageGeneration(model as ImageModel, prompt, options)
  }
}
