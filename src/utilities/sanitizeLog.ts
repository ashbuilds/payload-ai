// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sanitizeLog = (obj: any): any => {
  if (!obj) {
    return obj
  }
  
  // Truncate large string data
  if (typeof obj === 'string') {
    return obj.length > 500
      ? `${obj.substring(0, 500)}... [truncated ${obj.length - 500} chars]`
      : obj
  }
  
  // Omit buffer/binary data to prevent huge output
  if (
    typeof Buffer !== 'undefined' && Buffer.isBuffer(obj) ||
    obj instanceof ArrayBuffer ||
    (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(obj))
  ) {
    return '[Buffer/Binary omitted for logs]'
  }
  
  // Recurse arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeLog(item))
  }
  
  // Clone and recurse objects
  if (typeof obj === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serialized: Record<string, any> = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Explicitly catch AI SDK objects or large image representations
        if (key === 'base64' || key === 'base64Data' || key === 'uint8Array' || key === 'data') {
          if (typeof obj[key] === 'string' && obj[key].length > 500) {
            serialized[key] = '[Base64 omitted for logs]'
            continue
          }
        }
        serialized[key] = sanitizeLog(obj[key])
      }
    }
    return serialized
  }
  
  return obj
}
