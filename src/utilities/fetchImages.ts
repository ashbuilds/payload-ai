import type { ImagePart } from 'ai'
import type { PayloadRequest } from 'payload'

import * as process from 'node:process'

export interface FetchableImage {
  image: {
    mimeType?: string
    thumbnailURL?: string
    url: string
  }
}

/**
 * Fetches images from a list of objects containing URLs (and optional thumbnails/mimetypes)
 * and converts them to AI SDK compatible ImageParts.
 */
export async function fetchImages(
  req: PayloadRequest,
  images: FetchableImage[],
): Promise<ImagePart[]> {
  const imageParts: ImagePart[] = []

  for (const img of images) {
    const serverURL =
      req.payload.config?.serverURL ||
      process.env.SERVER_URL ||
      process.env.NEXT_PUBLIC_SERVER_URL

    let url = img.image.thumbnailURL || img.image.url
    if (!url.startsWith('http')) {
      url = `${String(serverURL)}${String(url)}`
    }

    try {
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

      imageParts.push({
        type: 'image',
        image: arrayBuffer,
        mediaType: img.image.mimeType || blob.type || 'image/png',
      })
    } catch (e) {
      req.payload.logger.error(e, `Error fetching reference image ${url}`)
      throw new Error(
        "We couldn't fetch the images. Please ensure the images are accessible and hosted publicly.",
      )
    }
  }

  return imageParts
}
