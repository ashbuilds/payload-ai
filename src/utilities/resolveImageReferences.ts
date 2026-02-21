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
 * Retrieves a nested value from an object using dot-notation path.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj as unknown)
}

/**
 * Parses and resolves image references in prompts.
 *
 * Supports two formats:
 * - @fieldName - for single upload fields
 * - @collection.fieldName - schema path format (collection prefix is stripped)
 * - @fieldName:filename.jpg - for specific images in hasMany fields
 *
 * @param prompt - The prompt text containing @field references
 * @param contextData - The document data to resolve field values from
 * @param req - Payload request object for fetching media
 * @param collectionSlug - Optional collection slug to strip from schema path references
 * @returns Processed prompt with references removed and array of resolved images
 */
export async function resolveImageReferences(
  prompt: string,
  contextData: Record<string, unknown>,
  req: PayloadRequest,
  collectionSlug?: string,
): Promise<ResolveImageReferencesResult> {
  // Pattern matches: @fieldName or @fieldName:filename.ext
  const pattern = /@([\w.]+)(?::(.+?\.(?:png|jpe?g|webp|gif)))?/gi
  const references: ImageReference[] = []
  let match: null | RegExpExecArray

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

  // Resolve all references in parallel
  const results = await Promise.allSettled(
    references.map(async (ref) => {
      // Strip collection prefix from schema path if it matches
      let fieldPath = ref.fieldName
      if (collectionSlug && fieldPath.startsWith(`${collectionSlug}.`)) {
        fieldPath = fieldPath.slice(collectionSlug.length + 1)
      }

      const fieldValue = getNestedValue(contextData, fieldPath)
      if (!fieldValue) {
        req.payload.logger.warn(
          `Image reference @${ref.fieldName} not found in document context`,
        )
        return null
      }

      let mediaDoc: null | Record<string, unknown> = null

      if (!ref.filename) {
        mediaDoc = await resolveMediaDocument(fieldValue, req, collectionSlug)
      } else {
        mediaDoc = await resolveMediaFromArray(fieldValue, ref.filename, req, collectionSlug)
      }

      return mediaDoc ? { image: formatImageData(mediaDoc), ref } : null
    }),
  )

  const resolvedImages: ResolvedImage[] = []
  let processedPrompt = prompt

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      resolvedImages.push(result.value.image)
      processedPrompt = processedPrompt.replace(result.value.ref.fullMatch, '')
    } else if (result.status === 'rejected') {
      req.payload.logger.error(result.reason, 'Error resolving image reference')
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
 * Resolves a single media document from an ID or populated object.
 * Uses the upload collection's `relationTo` from the field config when available,
 * falling back to common collection names.
 */
async function resolveMediaDocument(
  value: unknown,
  req: PayloadRequest,
  collectionSlug?: string,
): Promise<null | Record<string, unknown>> {
  // If it's already a populated object with required fields
  if (typeof value === 'object' && value !== null && 'url' in value) {
    return value as Record<string, unknown>
  }

  // If it's an ID string or number, fetch the media document
  if (typeof value === 'string' || typeof value === 'number') {
    // Build collection candidates: prefer the known upload collections from config,
    // then fall back to common names
    const uploadCollections = req.payload.config.collections
      .filter((c) => c.upload)
      .map((c) => c.slug)

    const candidates = uploadCollections.length > 0
      ? uploadCollections
      : ['media', 'uploads']

    for (const slug of candidates) {
      try {
        const mediaDoc = await req.payload.findByID({
          id: value,
          collection: slug,
          req,
        })
        if (mediaDoc) {
          return mediaDoc as Record<string, unknown>
        }
      } catch {
        // Continue to next collection
        continue
      }
    }
  }

  return null
}

/**
 * Resolves a specific media document from an array by matching filename.
 * Resolves items in parallel for better performance.
 */
async function resolveMediaFromArray(
  arrayValue: unknown,
  filename: string,
  req: PayloadRequest,
  collectionSlug?: string,
): Promise<null | Record<string, unknown>> {
  if (!Array.isArray(arrayValue)) {
    return null
  }

  // Resolve all items in parallel
  const results = await Promise.allSettled(
    arrayValue.map((item) => resolveMediaDocument(item, req, collectionSlug)),
  )

  // Find the first match
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value && matchesFilename(result.value, filename)) {
      return result.value
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
