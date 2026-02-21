import type { PayloadRequest } from 'payload'

import * as process from 'node:process'

import { PLUGIN_AI_JOBS_TABLE, PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js'

/**
 * Videogen webhook handler.
 * Receives async callbacks from video generation providers (e.g. fal.ai)
 * and updates the corresponding AI Job records.
 */
export const videogenWebhookHandler = async (req: PayloadRequest) => {
  try {
    const urlAll = new URL(req.url || '')
    const qpSecret = urlAll.searchParams.get('secret') || ''
    const headerSecret = req.headers.get('x-webhook-secret') || ''
    const falSecret = process.env.FAL_WEBHOOK_SECRET
    const legacySecret = process.env.VIDEOGEN_WEBHOOK_SECRET
    const provided = qpSecret || headerSecret
    // TODO: fal is failing because of auth but webhook seem to work
    if (!provided || (falSecret ? provided !== falSecret : provided !== legacySecret)) {
      return new Response('Unauthorized', { status: 401 })
    }

    const instructionId = urlAll.searchParams.get('instructionId')
    if (!instructionId) {
      throw new Error('instructionId missing')
    }

    const body = await req.json?.()
    // Normalize fal webhook payload
    const status: string | undefined =
      (body && (body.status || body.data?.status || body.response?.status)) || undefined
    const progress: number | undefined =
      (body && (body.progress ?? body.data?.progress ?? body.response?.progress)) ?? undefined
    const requestId: string | undefined =
      (body &&
        (body.taskId ||
          body.request_id ||
          body.gateway_request_id ||
          body.request?.request_id)) ||
      undefined
    const error = body?.error || body?.data?.error || body?.response?.error

    // Update AI Job row by task_id (and instructionId)
    const jobSearch = await req.payload.find({
      collection: PLUGIN_AI_JOBS_TABLE,
      depth: 0,
      limit: 1,
      where: {
        and: [
          { task_id: { equals: requestId } },
          { instructionId: { equals: instructionId } },
        ],
      },
    })

    const jobDoc = jobSearch.docs?.[0]
    if (jobDoc) {
      await req.payload.update({
        id: jobDoc.id,
        collection: PLUGIN_AI_JOBS_TABLE,
        data: {
          progress,
          status,
          task_id: requestId,
        },
        overrideAccess: true,
        req,
      })
    }

    const videoUrl =
      body?.outputs?.[0]?.url ||
      body?.data?.outputs?.[0]?.url ||
      body?.video?.url ||
      body?.data?.video?.url ||
      body?.response?.video?.url ||
      body?.videos?.[0]?.url ||
      body?.data?.videos?.[0]?.url

    if (status === 'completed' && videoUrl) {
      // Fetch the related instruction to get upload collection
      const instructions = await req.payload.findByID({
        id: instructionId,
        collection: PLUGIN_INSTRUCTIONS_TABLE,
        req,
      })

      const uploadCollectionSlug = instructions['relation-to']

      const videoResp = await fetch(videoUrl)
      if (!videoResp.ok) {
        throw new Error(`Failed to fetch output: ${videoResp.status}`)
      }
      const buffer = Buffer.from(await videoResp.arrayBuffer())

      const created = await req.payload.create({
        collection: uploadCollectionSlug,
        data: { alt: 'video generation' },
        file: {
          name: 'video_generation.mp4',
          data: buffer,
          mimetype: 'video/mp4',
          size: buffer.byteLength,
        },
        overrideAccess: true,
        req,
      })

      // Persist the result on the AI Job record
      if (jobDoc) {
        await req.payload.update({
          id: jobDoc.id,
          collection: PLUGIN_AI_JOBS_TABLE,
          data: {
            progress: 100,
            result_id: created?.id,
            status: 'completed',
          },
          overrideAccess: true,
          req,
        })
      }
    }

    if (status === 'failed' && error) {
      req.payload.logger.error(error, 'Video generation failed: ')
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    req.payload.logger.error(error, 'Error in videogen webhook: ')
    const message =
      error && typeof error === 'object' && 'message' in error
        ? (error as any).message
        : String(error)
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}
