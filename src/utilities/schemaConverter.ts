import type { Field } from 'payload'

import { z } from 'zod'

export function convertPayloadSchemaToZod(fields: Field[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of fields) {
    if ('name' in field && field.name) {
      // Handle simple fields with names
      switch (field.type) {
        case 'array':
          if (field.fields) {
            shape[field.name] = z.array(convertPayloadSchemaToZod(field.fields))
            if (!field.required) {
              shape[field.name] = shape[field.name].optional()
            }
            if (field.admin?.description) {
              shape[field.name] = shape[field.name].describe(field.admin.description as string)
            }
          }
          break
        case 'checkbox':
          shape[field.name] = z.boolean()
          if (!field.required) {
            shape[field.name] = shape[field.name].optional()
          }
          if (field.admin?.description) {
            shape[field.name] = shape[field.name].describe(field.admin.description as string)
          }
          break
        case 'code':
        case 'email':
        case 'radio':
        case 'select':
        case 'text':
        case 'textarea':
          shape[field.name] = z.string()
          if (field.required) {
            // keep it required
          } else {
            shape[field.name] = shape[field.name].optional()
          }
          // Add description if available
          if (field.admin?.description) {
            shape[field.name] = shape[field.name].describe(field.admin.description as string)
          }
          break
        case 'date':
          shape[field.name] = z.string().datetime()
          if (!field.required) {
            shape[field.name] = shape[field.name].optional()
          }
          if (field.admin?.description) {
            shape[field.name] = shape[field.name].describe(field.admin.description as string)
          }
          break
        case 'group':
          if (field.fields) {
            shape[field.name] = convertPayloadSchemaToZod(field.fields)
            if (!field.required) {
              shape[field.name] = shape[field.name].optional()
            }
            if (field.admin?.description) {
              shape[field.name] = shape[field.name].describe(field.admin.description as string)
            }
          }
          break
        case 'json':
          shape[field.name] = z.any()
          if (field.admin?.description) {
            shape[field.name] = shape[field.name].describe(field.admin.description as string)
          }
          break
        case 'number':
          shape[field.name] = z.number()
          if (!field.required) {
            shape[field.name] = shape[field.name].optional()
          }
          if (field.admin?.description) {
            shape[field.name] = shape[field.name].describe(field.admin.description as string)
          }
          break
        // Add more types as needed
      }
    } else {
      // Handle fields without names (row, collapsible, etc.) that flatten into parent
      if (field.type === 'row' || field.type === 'collapsible') {
        const subSchema = convertPayloadSchemaToZod(field.fields)
        // Merge subSchema shape into current shape
        Object.assign(shape, subSchema.shape)
      }
    }
  }

  return z.object(shape)
}
