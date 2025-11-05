import { fal } from '@fal-ai/client'

import type { GenerationConfig } from '../../../types.js'

const DEFAULT_IMAGE2VIDEO_MODEL =
  process.env.FAL_IMAGE2VIDEO_MODEL || 'fal-ai/minimax-video/image-to-video'

const DEFAULT_TEXT2VIDEO_MODEL = process.env.FAL_TEXT2VIDEO_MODEL || 'fal-ai/luma-dream-machine'

const MODEL_KEY = 'fal'

function buildFalWebhookUrl(callbackUrl?: string) {
  if (!callbackUrl) {
    return undefined
  }
  try {
    const url = new URL(callbackUrl)
    const secret = process.env.FAL_WEBHOOK_SECRET
    if (secret) {
      url.searchParams.set('secret', secret)
    }
    return url.toString()
  } catch {
    return undefined
  }
}

/**
 * Submit a request to fal queue endpoint and return the request id for async tracking.
 */
async function submitFalJob({
  body,
  modelId,
  webhookUrl,
}: {
  body: Record<string, any>
  modelId: string
  webhookUrl?: string
}) {
  const FAL_KEY = process.env.FAL_KEY
  if (!FAL_KEY) {
    throw new Error('FAL service unavailable: FAL_KEY not set')
  }

  const falWebhookQS = webhookUrl ? `?fal_webhook=${encodeURIComponent(webhookUrl)}` : ''
  const endpoint = `https://queue.fal.run/${modelId}${falWebhookQS}`

  const resp = await fetch(endpoint, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`fal request failed: ${resp.status} ${text}`)
  }

  const json = (await resp.json()) as {
    gateway_request_id?: string
    request_id?: string
  }

  const requestId = json.request_id || json.gateway_request_id
  if (!requestId) {
    throw new Error('fal response missing request_id')
  }

  return requestId
}

function ensureFalClient() {
  const key = process.env.FAL_KEY
  if (!key) {
    throw new Error('FAL service unavailable: FAL_KEY not set')
  }
  fal.config({ credentials: key })
}

async function uploadImageToFal(img: {
  data?: any
  name?: string
  size?: number
  type?: string
  url?: string
}) {
  ensureFalClient()

  let fileLike: any
  if (img.data) {
    const name = img.name || 'image.jpg'
    const type = img.type || 'application/octet-stream'
    const FileCtor = (globalThis as any).File
    try {
      fileLike = FileCtor ? new FileCtor([img.data], name, { type }) : img.data
    } catch {
      fileLike = img.data
    }
  } else if (img.url) {
    const resp = await fetch(img.url)
    if (!resp.ok) {
      throw new Error(`Failed to fetch image for upload: ${resp.status}`)
    }
    const blob = await resp.blob()
    const name = img.name || img.url.split('/').pop() || 'image.jpg'
    const type = img.type || (blob as any).type || 'application/octet-stream'
    const FileCtor = (globalThis as any).File
    try {
      fileLike = FileCtor ? new FileCtor([blob], name, { type }) : blob
    } catch {
      fileLike = blob
    }
  } else {
    throw new Error('No image data provided')
  }

  return await fal.storage.upload(fileLike)
}

export const FalVideoConfig: GenerationConfig = {
  models: [
    // Image -> Video
    {
      id: `${MODEL_KEY}-i2v`,
      name: 'Fal Image2Video',
      fields: ['upload'],
      handler: async (
        prompt: string,
        options: {
          callbackUrl?: string
          durationSeconds?: number
          falModelId?: string
          fps?: number
          height?: number
          images?: Array<{ data?: any; name?: string; size?: number; type?: string; url?: string }>
          instructionId?: number | string
          seed?: number
          // collected but only forwarded selectively when/if supported by the target model:
          width?: number
        },
      ) => {
        const img = options?.images?.[0]
        if (!img) {
          throw new Error('Input image required')
        }
        const uploadedUrl = await uploadImageToFal(img)

        const modelId = options?.falModelId || DEFAULT_IMAGE2VIDEO_MODEL
        const webhookUrl = buildFalWebhookUrl(options?.callbackUrl)

        console.log('uploadedUrl', uploadedUrl)
        // Minimal, model-compatible payload (avoid sending unsupported keys)
        const payload: Record<string, any> = {
          image_url: uploadedUrl,
          prompt,
        }

        // Note: If you later standardize on a model that supports these, uncomment mapping below:
        // if (options.width) payload.width = options.width
        // if (options.height) payload.height = options.height
        // if (options.durationSeconds) payload.duration = options.durationSeconds
        // if (options.fps) payload.fps = options.fps
        // if (options.seed) payload.seed = options.seed

        const jobId = await submitFalJob({
          body: payload,
          modelId,
          webhookUrl,
        })

        return {
          jobId,
          progress: 0,
          status: 'queued',
        } as any
      },
      output: 'video',
      settings: {
        name: `${MODEL_KEY}-i2v-settings`,
        type: 'group',
        admin: {
          condition(data) {
            return data['model-id'] === `${MODEL_KEY}-i2v`
          },
        },
        fields: [
          {
            name: 'falModelId',
            type: 'select',
            defaultValue: DEFAULT_IMAGE2VIDEO_MODEL,
            label: 'Fal Model',
            options: [
              {
                label: 'MiniMax - Image to Video',
                value: 'fal-ai/minimax-video/image-to-video',
              },
              {
                label: 'Wan 2.1 Pro - Image to Video',
                value: 'fal-ai/wan-pro/image-to-video',
              },
              {
                label: 'Ovi - Image to Video',
                value: 'fal-ai/ovi/image-to-video',
              },
              {
                label: 'Kling v1 Standard (text-to-video)',
                value: 'fal-ai/kling-video/v1/standard',
              },
              {
                label: 'Luma Dream Machine (text-to-video)',
                value: 'fal-ai/luma-dream-machine',
              },
              {
                label: 'Custom (use env default)',
                value: '',
              },
            ],
          },
          {
            type: 'row',
            fields: [
              { name: 'width', type: 'number', label: 'Width' },
              { name: 'height', type: 'number', label: 'Height' },
            ],
          },
          { name: 'durationSeconds', type: 'number', label: 'Duration (seconds)' },
          { name: 'fps', type: 'number', label: 'FPS' },
          { name: 'seed', type: 'number', label: 'Seed' },
        ],
        label: 'Fal Image2Video Settings',
      },
    },

    // Text -> Video
    {
      id: `${MODEL_KEY}-t2v`,
      name: 'Fal Text2Video',
      fields: ['upload'],
      handler: async (
        prompt: string,
        options: {
          callbackUrl?: string
          durationSeconds?: number
          falModelId?: string
          fps?: number
          height?: number
          instructionId?: number | string
          seed?: number
          // collected but only forwarded selectively when/if supported by the target model:
          width?: number
        },
      ) => {
        const modelId = options?.falModelId || DEFAULT_TEXT2VIDEO_MODEL
        const webhookUrl = buildFalWebhookUrl(options?.callbackUrl)

        const payload: Record<string, any> = {
          prompt,
        }

        // Potential future mappings if/when model supports them:
        // if (options.width) payload.width = options.width
        // if (options.height) payload.height = options.height
        // if (options.durationSeconds) payload.duration = options.durationSeconds
        // if (options.fps) payload.fps = options.fps
        // if (options.seed) payload.seed = options.seed

        const jobId = await submitFalJob({
          body: payload,
          modelId,
          webhookUrl,
        })

        return {
          jobId,
          progress: 0,
          status: 'queued',
        } as any
      },
      output: 'video',
      settings: {
        name: `${MODEL_KEY}-t2v-settings`,
        type: 'group',
        admin: {
          condition(data) {
            return data['model-id'] === `${MODEL_KEY}-t2v`
          },
        },
        fields: [
          {
            name: 'falModelId',
            type: 'select',
            defaultValue: DEFAULT_TEXT2VIDEO_MODEL,
            label: 'Fal Model',
            options: [
              {
                label: 'Luma Dream Machine',
                value: 'fal-ai/luma-dream-machine',
              },
              {
                label: 'Kling v1 Standard',
                value: 'fal-ai/kling-video/v1/standard',
              },
              {
                label: 'MiniMax - Image to Video',
                value: 'fal-ai/minimax-video/image-to-video',
              },
              { label: 'Custom (use env default)', value: '' },
            ],
          },
          {
            type: 'row',
            fields: [
              { name: 'width', type: 'number', label: 'Width' },
              { name: 'height', type: 'number', label: 'Height' },
            ],
          },
          { name: 'durationSeconds', type: 'number', label: 'Duration (seconds)' },
          { name: 'fps', type: 'number', label: 'FPS' },
          { name: 'seed', type: 'number', label: 'Seed' },
        ],
        label: 'Fal Text2Video Settings',
      },
    },
  ],
  provider: 'Fal',
}
