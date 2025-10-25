import type { File } from 'payload'

import type { GenerationConfig } from '../../../types.js'

import { generateFileNameByPrompt } from '../../utils/generateFileNameByPrompt.js'

const MODEL_ID = 'VideoGen-image2video'

async function blobToBase64WithPrefix(blob: Blob, mime?: string) {
  const arrayBuffer = await blob.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const type = mime || (blob as any).type || 'image/png'
  return `data:${type};base64,${base64}`
}

export const VideoGenConfig: GenerationConfig = {
  models: [
    {
      id: MODEL_ID,
      name: 'VideoGen Image2Video',
      fields: ['upload'],
      handler: async (
        prompt: string,
        options: {
          callbackUrl?: string
          cfg_stage1?: number
          cfg_stage2?: number
          fps?: number
          height?: number
          images?: Array<{ data: Blob; name: string; size: number; type: string; url: string }>
          instructionId?: number | string
          length?: number
          negativePrompt?: string
          steps_stage1?: number
          steps_stage2?: number
          width?: number
        },
      ) => {
        const baseUrl = process.env.VIDEOGEN_API_URL
        if (!baseUrl) {
          throw new Error('VideoGen service unavailable: VIDEOGEN_API_URL not set')
        }

        const img = options?.images?.[0]
        if (!img || !img.data) {
          throw new Error('Input image required to generate video')
        }

        const imageBase64 = await blobToBase64WithPrefix(img.data, img.type)
        const payload: Record<string, any> = {
          callbackUrl: options?.callbackUrl,
          cfg_stage1: options?.cfg_stage1,
          cfg_stage2: options?.cfg_stage2,
          fps: options?.fps,
          height: options?.height,
          imageBase64,
          length: options?.length,
          negativePrompt: options?.negativePrompt,
          prompt,
          steps_stage1: options?.steps_stage1,
          steps_stage2: options?.steps_stage2,
          width: options?.width,
        }

        const resp = await fetch(`${baseUrl}/api/video/generate`, {
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })

        if (!resp.ok) {
          throw new Error(`VideoGen request failed: ${resp.status}`)
        }

        const json = (await resp.json()) as {
          jobId?: string
          ok?: boolean
          outputs?: Array<{ url: string }>
          progress?: number
          status?: string
          taskId?: string
        }

        // Support both sync and async server behaviors
        const url = json?.outputs?.[0]?.url
        if (json?.ok && url) {
          const videoResp = await fetch(url)
          if (!videoResp.ok) {
            throw new Error(`Failed to fetch generated video: ${videoResp.status}`)
          }
          const videoBuffer = Buffer.from(await videoResp.arrayBuffer())
          return {
            data: { alt: prompt },
            file: {
              name: `video_${generateFileNameByPrompt(prompt)}.mp4`,
              data: videoBuffer,
              mimetype: 'video/mp4',
              size: videoBuffer.byteLength,
            } as File,
          }
        }

        const jobId = json.taskId || json.jobId
        if (jobId) {
          return { jobId, progress: json.progress ?? 0, status: json.status || 'queued' } as any
        }

        throw new Error('Unexpected VideoGen response')
      },
      output: 'video',
      settings: {
        name: `${MODEL_ID}-settings`,
        type: 'group',
        admin: {
          condition(data) {
            return data['model-id'] === MODEL_ID
          },
        },
        fields: [
          {
            name: 'negativePrompt',
            type: 'textarea',
            label: 'Negative Prompt',
          },
          {
            type: 'row',
            fields: [
              { name: 'width', type: 'number', label: 'Width' },
              { name: 'height', type: 'number', label: 'Height' },
            ],
          },
          { name: 'length', type: 'number', label: 'Length (seconds)' },
          { name: 'fps', type: 'number', defaultValue: 24, label: 'FPS' },
          {
            type: 'row',
            fields: [
              { name: 'steps_stage1', type: 'number', label: 'Steps (stage 1)' },
              { name: 'cfg_stage1', type: 'number', label: 'CFG (stage 1)' },
            ],
          },
          {
            type: 'row',
            fields: [
              { name: 'steps_stage2', type: 'number', label: 'Steps (stage 2)' },
              { name: 'cfg_stage2', type: 'number', label: 'CFG (stage 2)' },
            ],
          },
        ],
        label: 'VideoGen Image2Video Settings',
      },
    },
  ],
  provider: 'VideoGen',
}
