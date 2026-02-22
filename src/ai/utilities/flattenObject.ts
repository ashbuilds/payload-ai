import type { ProviderOption } from '../providers/types.js'

/**
 * Utility to flatten a deeply nested configuration object into a flat array
 * of ProviderOption objects suitable for the AIProviders collection.
 *
 * Example:
 * Input: { apiKey: '123', advanced: { maxLoops: 3, temperature: 0.7, fallback: false }, stop: ['\n', 'END'] }
 * Output: [
 *   { key: 'apiKey', type: 'text', valueText: '123' },
 *   { key: 'advanced.maxLoops', type: 'number', valueNumber: 3 },
 *   { key: 'advanced.temperature', type: 'number', valueNumber: 0.7 },
 *   { key: 'advanced.fallback', type: 'boolean', valueBoolean: false },
 *   { key: 'stop', type: 'options', valueOptions: [{ value: '\n' }, { value: 'END' }] }
 * ]
 */
export function flattenObject(
  obj: Record<string, any>,
  prefix = '',
): ProviderOption[] {
  let result: ProviderOption[] = []

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) {
      continue
    }

    const newKey = prefix ? `${prefix}.${key}` : key

    if (Array.isArray(value)) {
      // If array of strings/numbers/booleans, map to valueOptions
      result.push({
        type: 'options',
        key: newKey,
        valueOptions: value.map((v) => ({ value: String(v) })),
      })
    } else if (typeof value === 'object' && value !== null) {
      // Recurse into nested objects
      result = result.concat(flattenObject(value, newKey))
    } else if (typeof value === 'boolean') {
      result.push({
        type: 'boolean',
        key: newKey,
        valueBoolean: value,
      })
    } else if (typeof value === 'number') {
      result.push({
        type: 'number',
        key: newKey,
        valueNumber: value,
      })
    } else {
      // Fallback to text
      result.push({
        type: 'text',
        key: newKey,
        valueText: String(value),
      })
    }
  }

  return result
}
