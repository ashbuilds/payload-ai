import { fal } from '@fal-ai/client'

import type { GenerationConfig } from '../../types.js'

import { allProviderBlocks } from '../providers/blocks/index.js'
import { getProviderRegistry } from '../providers/index.js'

const DEFAULT_IMAGE2VIDEO_MODEL =
  process.env.FAL_IMAGE2VIDEO_MODEL || 'fal-ai/minimax-video/image-to-video'

const DEFAULT_TEXT2VIDEO_MODEL = process.env.FAL_TEXT2VIDEO_MODEL || 'fal-ai/luma-dream-machine'

type Mode = 'i2v' | 't2v'

type VideoOptions = {
  callbackUrl?: string
  // kept for future mappings:
  durationSeconds?: number
  falModelId?: string
  fps?: number
  height?: number
  images?: Array<{ data?: any; name?: string; size?: number; type?: string; url?: string }>
  instructionId?: number | string
  mode: Mode
  seed?: number

  width?: number
}

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

async function uploadImageToFal(img: {
  data?: any
  name?: string
  size?: number
  type?: string
  url?: string
}) {
  // Fal client is already configured by the registry factory call in the handler
  
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

// Helper to extract models from blocks
const getModelsFromBlocks = (useCase: string) => {
  const models: { label: string; value: string }[] = []
  
  allProviderBlocks.forEach((block) => {
    const providerId = block.slug
    const modelsField = block.fields.find((f: any) => f.name === 'models')
    const defaultModels = modelsField && 'defaultValue' in modelsField ? (modelsField.defaultValue as any[]) : []
    
    defaultModels.forEach((m) => {
      if (m.useCase === useCase) {
        models.push({
          label: `${block.labels?.singular || providerId} - ${m.name}`,
          value: m.id,
        })
      }
    })
  })
  
  return models
}

export const VideoConfig: GenerationConfig = {
  models: [
    {
      id: 'video',
      name: 'Video (Fal)',
      fields: ['upload'],
      handler: async (prompt: string, options: VideoOptions & { req: any }) => {
        const { req } = options
        
        // Initialize Fal provider from registry
        const registry = await getProviderRegistry(req.payload)
        const falProvider = registry.fal
        
        if (!falProvider || !falProvider.enabled || !falProvider.factory) {
          throw new Error('Fal provider is not enabled or configured')
        }
        
        // This call configures the global process.env.FAL_KEY
        falProvider.factory()
        
        const mode = options.mode || 't2v'
        const webhookUrl = buildFalWebhookUrl(options?.callbackUrl)

        if (mode === 'i2v') {
          const img = options?.images?.[0]
          if (!img) {
            throw new Error('Input image required for image-to-video')
          }
          const uploadedUrl = await uploadImageToFal(img)
          const modelId = options?.falModelId || DEFAULT_IMAGE2VIDEO_MODEL

          const payload: Record<string, any> = {
            image_url: uploadedUrl,
            prompt,
          }
          // Future mapping:
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
        }

        // text-to-video
        const modelId = options?.falModelId || DEFAULT_TEXT2VIDEO_MODEL
        const payload: Record<string, any> = {
          prompt,
        }
        // Potential future mappings (see above)

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
        name: 'video-settings',
        type: 'group',
        admin: {
          condition(data) {
            return data['model-id'] === 'video'
          },
        },
        fields: [
          {
            name: 'mode',
            type: 'select',
            defaultValue: 't2v',
            label: 'Mode',
            options: [
              { label: 'Text → Video', value: 't2v' },
              { label: 'Image → Video', value: 'i2v' },
            ],
          },
          {
            name: 'falModelId',
            type: 'select',
            defaultValue: DEFAULT_TEXT2VIDEO_MODEL,
            label: 'Fal Model',
            options: getModelsFromBlocks('video'),
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
        label: 'Fal Video Settings',
      },
    },
  ],
  provider: 'Fal',
}
