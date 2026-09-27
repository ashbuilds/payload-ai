import type { PayloadRequest } from 'payload'

import { APIError } from 'payload'

import type { ImageReference, PluginConfig, ReferenceImageSource } from '../types.js'

const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const TIMEOUT_MS = 30_000

type Input = { id: unknown; kind: 'media' } | { kind: 'url'; url: string }

// Storage access belongs to the deployment. The plugin never fetches input URLs.
export const resolveReferenceImage = async (
  input: Input,
  request: PayloadRequest,
  config: PluginConfig,
): Promise<ImageReference> => {
  if (!config.resolveReferenceImage) {
    throw new APIError('Reference images require a configured resolveReferenceImage callback.', 400)
  }

  let source: ReferenceImageSource
  if (input.kind === 'media') {
    if (typeof input.id !== 'string' && typeof input.id !== 'number') {
      throw new APIError('Invalid reference media ID.', 400)
    }
    const collection = config.uploadCollectionSlug || 'media'
    const document = await request.payload.findByID({
      id: input.id,
      collection,
      depth: 0,
      overrideAccess: false,
      req: request,
    })
    source = { collection, document, kind: 'media' }
  } else {
    source = input
  }

  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort()
      reject(new APIError('Reference image resolution timed out.', 408))
    }, TIMEOUT_MS)
  })
  try {
    const blob = await Promise.race([
      config.resolveReferenceImage({
        maxBytes: MAX_IMAGE_BYTES,
        request,
        signal: controller.signal,
        source,
      }),
      deadline,
    ])
    if (!(blob instanceof Blob) || !['image/jpeg', 'image/png', 'image/webp'].includes(blob.type)) {
      throw new APIError('Reference image resolver must return a PNG, JPEG, or WebP Blob.', 400)
    }
    if (!blob.size || blob.size > MAX_IMAGE_BYTES) {
      throw new APIError('Reference images must be nonempty and no larger than 20 MiB.', 400)
    }
    return {
      name: source.kind === 'media' ? String(source.document.filename || 'reference') : 'reference',
      type: blob.type,
      data: blob,
      size: blob.size,
      url: source.kind === 'url' ? source.url : String(source.document.url || ''),
    }
  } finally {
    clearTimeout(timer)
    controller.abort()
  }
}
