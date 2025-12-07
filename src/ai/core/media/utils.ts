/**
 * Shared utilities for media generation
 */

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/aac': 'aac',
    'audio/flac': 'flac',
    'audio/L16': 'pcm',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/opus': 'opus',
    'audio/wav': 'wav',
    'image/bmp': 'bmp',
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/tiff': 'tiff',
    'image/webp': 'webp',
  }

  return mimeToExt[mimeType.toLowerCase()] || 'bin'
}

/**
 * Convert image/audio data to Buffer
 */
export function convertToBuffer(data: string | Uint8Array): Buffer {
  if (typeof data === 'string') {
    return Buffer.from(data, 'base64')
  }
  return Buffer.from(data)
}
