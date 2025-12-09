import type { MediaResult, VideoGenerationArgs } from '../types.js'

/**
 * Generate video using Fal provider
 * Delegates to existing Fal handler to avoid disrupting webhook/job logic
 */
export async function generateVideo(args: VideoGenerationArgs): Promise<MediaResult> {
  const { provider } = args

  // Currently only supporting Fal for video
  if (provider?.toLowerCase() !== 'fal') {
    throw new Error(`Unsupported video provider: ${provider}`)
  }

  // Delegate to existing Fal video handler
  // This maintains compatibility with the existing webhook/job management system
  // const { VideoConfig } = await import('../../../models/video.js')
  const videoModel: any = {} // ||VideoConfig.models[0]

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
