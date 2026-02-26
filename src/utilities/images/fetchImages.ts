import type { ImagePart } from 'ai'
import type { PayloadRequest } from 'payload'

import { resolveAbsoluteURL } from '../runtime/resolveServerURL.js'

export interface FetchableImage {
  image: {
    mimeType?: string
    thumbnailURL?: string
    url: string
  }
}

/**
 * Fetch a single image and convert to an AI SDK ImagePart.
 */
async function fetchSingleImage(
  req: PayloadRequest,
  img: FetchableImage,
): Promise<ImagePart> {
  const url = resolveAbsoluteURL(img.image.thumbnailURL || img.image.url, req)

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${req.headers.get('Authorization')?.split('Bearer ')[1] || ''}`,
    },
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`)
  }

  const blob = await response.blob()
  const arrayBuffer = await blob.arrayBuffer()

  return {
    type: 'image',
    image: arrayBuffer,
    mediaType: img.image.mimeType || blob.type || 'image/png',
  }
}

/**
 * Fetches images in parallel from a list of objects containing URLs
 * and converts them to AI SDK compatible ImageParts.
 */
export async function fetchImages(
  req: PayloadRequest,
  images: FetchableImage[],
): Promise<ImagePart[]> {
  if (images.length === 0) {
    return []
  }

  const results = await Promise.allSettled(
    images.map((img) => fetchSingleImage(req, img)),
  )

  const imageParts: ImagePart[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      imageParts.push(result.value)
    } else {
      req.payload.logger.error(result.reason, '— AI Plugin: Error fetching reference image')
    }
  }

  if (imageParts.length === 0 && images.length > 0) {
    throw new Error(
      "We couldn't fetch any of the images. Please ensure the images are accessible and hosted publicly.",
    )
  }

  return imageParts
}
