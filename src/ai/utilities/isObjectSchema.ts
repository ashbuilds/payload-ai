import type { LexicalNodeSchema } from '../schemas/lexicalJsonSchema.js'

export function isObjectSchema(schema: unknown): schema is LexicalNodeSchema {
  return typeof schema === 'object' && schema !== null && !Array.isArray(schema)
}
