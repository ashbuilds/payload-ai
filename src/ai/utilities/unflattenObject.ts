/**
 * Utility to unflatten an object with dot-notation keys back into a deeply nested object.
 * This is the counterpart to flattenObject.
 *
 * Example:
 * Input: { 'advanced.maxLoops': 3, 'advanced.temperature': 0.7, 'apiKey': '123' }
 * Output: { advanced: { maxLoops: 3, temperature: 0.7 }, apiKey: '123' }
 */
export function unflattenObject(flatObj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(flatObj)) {
    const keys = key.split('.')
    let current = result

    for (let i = 0; i < keys.length; i++) {
      const isLast = i === keys.length - 1
      const part = keys[i]

      // Safeguard path part
      if (!part) {
        continue
      }

      if (isLast) {
        current[part] = value
      } else {
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {}
        }
        current = current[part]
      }
    }
  }

  return result
}
