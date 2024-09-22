import { z } from 'zod'

export const inferSchema = (obj: Record<string, unknown>) => {
  const schemaObj: Record<string, z.ZodTypeAny> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      schemaObj[key] = z.string()
    } else if (typeof value === 'number') {
      schemaObj[key] = z.number()
    } else if (typeof value === 'boolean') {
      schemaObj[key] = z.boolean()
    } else if (Array.isArray(value)) {
      schemaObj[key] = z.array(inferSchema(value[0]))
    } else if (typeof value === 'object' && value !== null) {
      schemaObj[key] = inferSchema(value as Record<string, unknown>)
    } else {
      schemaObj[key] = z.any()
    }
  }

  return z.object(schemaObj)
}
