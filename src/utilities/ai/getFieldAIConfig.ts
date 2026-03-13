import type { Field } from 'payload'

import type { AIFieldConfig } from '../../types.js'

export const getFieldAIConfig = (field: Field | null | undefined): AIFieldConfig | undefined => {
  if (!field || !field.custom || typeof field.custom !== 'object') {
    return undefined
  }

  const ai = (field.custom as Record<string, unknown>).ai
  if (!ai || typeof ai !== 'object') {
    return undefined
  }

  return ai as AIFieldConfig
}

export const toHookArray = <T>(hooks?: T | T[]): T[] => {
  if (!hooks) {
    return []
  }

  return Array.isArray(hooks) ? hooks : [hooks]
}
