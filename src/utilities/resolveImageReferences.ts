import type { PayloadRequest } from 'payload'

interface ImageReference {
  fieldName: string
  filename?: string
  fullMatch: string
}

export interface ResolvedImage {
  image: {
    mimeType?: string
    name: string
    thumbnailURL?: string
    type: string
    url: string
  }
}

interface ResolveImageReferencesResult {
  images: ResolvedImage[]
  processedPrompt: string
}

/**
 * Parses and resolves image references in prompts.
 * 
 * Supports two formats:
 * - @fieldName - for single upload fields
 * - @fieldName:filename.jpg - for specific images in hasMany fields
 * 
 * @param prompt - The prompt text containing @field references
 * @param contextData - The document data to resolve field values from
 * @param req - Payload request object for fetching media
 * @returns Processed prompt with references removed and array of resolved images
 */
export async function resolveImageReferences(
  prompt: string,
  contextData: Record<string, unknown>,
  req: PayloadRequest,
): Promise<ResolveImageReferencesResult> {
  // Pattern matches: @fieldName or @fieldName:filename.ext
  const pattern = /@([\w.]+)(?::(\S+))?/g
  const references: ImageReference[] = []
  let match: null | RegExpExecArray

  // Extract all image references
  while ((match = pattern.exec(prompt)) !== null) {
    references.push({
      fieldName: match[1],
      filename: match[2],
      fullMatch: match[0],
    })
  }

  if (references.length === 0) {
    return { images: [], processedPrompt: prompt }
  }

  const resolvedImages: ResolvedImage[] = []
  let processedPrompt = prompt

  // Resolve each reference
  for (const ref of references) {
    try {
      const fieldValue = contextData[ref.fieldName]

      if (!fieldValue) {
        req.payload.logger.warn(
          `Image reference @${ref.fieldName} not found in document context`,
        )
        continue
      }

      // Handle single upload field (value is an ID or object)
      if (!ref.filename) {
        const mediaDoc = await resolveMediaDocument(fieldValue, req)
        if (mediaDoc) {
          resolvedImages.push(formatImageData(mediaDoc))
        }
      }
      // Handle hasMany field with filename
      else {
        const mediaDoc = await resolveMediaFromArray(fieldValue, ref.filename, req)
        if (mediaDoc) {
          resolvedImages.push(formatImageData(mediaDoc))
        }
      }

      // Remove the reference from the prompt
      processedPrompt = processedPrompt.replace(ref.fullMatch, '')
    } catch (error) {
      req.payload.logger.error(
        error,
        `Error resolving image reference: ${ref.fullMatch}`,
      )
    }
  }

  // Clean up extra whitespace from removed references
  processedPrompt = processedPrompt.replace(/\s+/g, ' ').trim()

  return {
    images: resolvedImages,
    processedPrompt,
  }
}

/**
 * Resolves a single media document from an ID or populated object
 */
async function resolveMediaDocument(
  value: unknown,
  req: PayloadRequest,
): Promise<null | Record<string, unknown>> {
  // If it's already a populated object with required fields
  if (typeof value === 'object' && value !== null && 'url' in value) {
    return value as Record<string, unknown>
  }

  // If it's an ID string, fetch the media document
  if (typeof value === 'string' || typeof value === 'number') {
    try {
      // Try to find which collection this media belongs to
      // First, check the common 'media' collection
      const collections = ['media', 'uploads']

      for (const collectionSlug of collections) {
        try {
          const mediaDoc = await req.payload.findByID({
            id: value,
            collection: collectionSlug,
            req,
          })
          if (mediaDoc) {
            return mediaDoc as Record<string, unknown>
          }
        } catch (_ignore) {
          // Continue to next collection
          continue
        }
      }
    } catch (error) {
      req.payload.logger.error(error, 'Error fetching media document')
    }
  }

  return null
}

/**
 * Resolves a specific media document from an array by matching filename
 */
async function resolveMediaFromArray(
  arrayValue: unknown,
  filename: string,
  req: PayloadRequest,
): Promise<null | Record<string, unknown>> {
  if (!Array.isArray(arrayValue)) {
    return null
  }

  // Search through array for matching filename
  for (const item of arrayValue) {
    const mediaDoc = await resolveMediaDocument(item, req)

    if (mediaDoc && matchesFilename(mediaDoc, filename)) {
      return mediaDoc
    }
  }

  return null
}

/**
 * Checks if a media document matches the given filename
 */
function matchesFilename(mediaDoc: Record<string, unknown>, filename: string): boolean {
  const docFilename = mediaDoc.filename || mediaDoc.name

  if (!docFilename) {
    return false
  }

  // Case-insensitive match
  return (docFilename as string).toLowerCase() === filename.toLowerCase()
}

/**
 * Formats media document into the expected image data structure
 */
function formatImageData(mediaDoc: Record<string, unknown>): ResolvedImage {
  return {
    image: {
      name: (mediaDoc.filename || mediaDoc.name || 'unknown') as string,
      type: extractFileExtension((mediaDoc.filename || mediaDoc.name || '') as string),
      mimeType: (mediaDoc.mimeType || mediaDoc.mimetype) as string | undefined,
      thumbnailURL: mediaDoc.thumbnailURL as string | undefined,
      url: mediaDoc.url as string,
    },
  }
}

/**
 * Extracts file extension from filename
 */
function extractFileExtension(filename: string): string {
  const match = filename.match(/\.([^.]+)$/)
  return match ? match[1].toLowerCase() : 'unknown'
}
