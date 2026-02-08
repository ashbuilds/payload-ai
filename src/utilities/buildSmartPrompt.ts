'use strict'

import type { Field, Payload } from 'payload'

import { getFieldBySchemaPath } from './getFieldBySchemaPath.js'

export interface SmartPromptContext {
  /** The document data for template interpolation */
  documentData?: Record<string, unknown>
  /** The Payload instance to access collection config */
  payload: Payload
  /** The schema path like 'array-test-cases.teamMembers.contact.email' */
  schemaPath: string
}

interface FieldInfo {
  /** The field configuration */
  field: Field | null
  /** Human-readable field label */
  label: string
  /** Field name from the path */
  name: string
  /** Parent field name if nested (e.g., 'teamMembers' for 'teamMembers.name') */
  parentContext: null | string
  /** The field type */
  type: string
}

/**
 * Extract field information from a schema path
 */
const getFieldInfo = (schemaPath: string, payload: Payload): FieldInfo => {
  const parts = schemaPath.split('.')
  const collectionSlug = parts[0]
  const fieldPath = parts.slice(1)
  const fieldName = fieldPath[fieldPath.length - 1] || ''

  // Get parent context (e.g., 'teamMembers' for 'teamMembers.name')
  let parentContext: null | string = null
  if (fieldPath.length > 1) {
    parentContext = fieldPath[fieldPath.length - 2]
  }

  // Try to get the actual field configuration from the collection
  let field: Field | null = null
  const collection = payload.config.collections.find((c) => c.slug === collectionSlug)
  if (collection) {
    field = getFieldBySchemaPath(collection, schemaPath)
  }

  return {
    name: fieldName,
    type: field?.type || 'text',
    field,
    label: (field as { label?: string })?.label || fieldName,
    parentContext,
  }
}

/**
 * Humanize a camelCase or snake_case field name
 * e.g., 'teamMembers' -> 'team members', 'first_name' -> 'first name'
 */
const humanize = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to spaces
    .replace(/[_-]/g, ' ') // underscores/dashes to spaces
    .toLowerCase()
    .trim()
}

/**
 * Get a description snippet from field admin config
 */
const getFieldDescription = (field: Field | null): null | string => {
  if (!field) {
    return null
  }
  const admin = (field as { admin?: { description?: string } }).admin
  if (admin?.description && typeof admin.description === 'string') {
    return admin.description
  }
  return null
}

/**
 * Build type-specific prompt guidance
 */
const getTypeGuidance = (type: string, fieldName: string): string => {
  const nameHint = humanize(fieldName)

  switch (type) {
    case 'code':
      return `Generate code for ${nameHint}`
    case 'date':
      return `Generate an appropriate date for ${nameHint}`
    case 'email':
      return `Generate a valid professional email address`
    case 'json':
      return `Generate valid JSON data for ${nameHint}`
    case 'number':
      return `Generate an appropriate numeric value for ${nameHint}`
    case 'select':
      return `Select an appropriate option for ${nameHint}`
    case 'text':
      return `Generate appropriate text for ${nameHint}`
    case 'textarea':
      return `Write detailed content for ${nameHint}`
    case 'upload':
      // Explicit image generation instruction for multimodal models
      return `Generate an image of ${nameHint}`
    default:
      return `Generate content for ${nameHint}`
  }
}

/**
 * Build context from parent field name using generic humanization.
 * Works universally for any collection structure.
 */
const getParentContextPhrase = (parentContext: null | string): string => {
  if (!parentContext) {
    return ''
  }

  const humanized = humanize(parentContext)

  // Use singular form if the name ends with 's' (common for arrays)
  // e.g., "teamMembers" → "team member", "products" → "product"
  if (humanized.endsWith('s') && humanized.length > 2) {
    return `for a ${humanized.slice(0, -1)} entry`
  }

  return `for ${humanized}`
}

/**
 * Build a smart contextual prompt based on field metadata.
 * This is used as a fallback when the user hasn't set a custom prompt.
 *
 * @param context - The context containing schema path and document data
 * @returns A contextual prompt string that can be used for AI generation
 */
export const buildSmartPrompt = (context: SmartPromptContext): string => {
  const { documentData, payload, schemaPath } = context

  const fieldInfo = getFieldInfo(schemaPath, payload)
  const { name, type, field, label, parentContext } = fieldInfo

  // Start with the field's own description if available
  const description = getFieldDescription(field)

  // Build the prompt components
  const parts: string[] = []

  // Use description as primary guidance if available
  if (description) {
    parts.push(`Field description for user: ${description}\n`)
  }

  parts.push(getTypeGuidance(type, label || name))

  // Add parent context if nested
  const parentPhrase = getParentContextPhrase(parentContext)
  if (parentPhrase) {
    parts.push(parentPhrase)
  }

  // Add document title context if available
  const title = documentData?.title || documentData?.name

  if (title && typeof title === 'string') {
    parts.push(`in the context of "${title}"`)
  }

  // Build the final prompt
  let prompt = parts.join(' ')

  // Ensure first letter is capitalized
  prompt = prompt.charAt(0).toUpperCase() + prompt.slice(1)

  // Add instruction suffix for clarity
  if (!prompt.endsWith('.')) {
    prompt += '.'
  }

  return prompt
}

/**
 * Check if a prompt template is empty and should be replaced with a smart prompt.
 * Only triggers when the prompt is completely empty or whitespace-only.
 */
export const isGenericPrompt = (template: null | string | undefined): boolean => {
  if (!template) {
    return true
  }
  return template.trim() === ''
}
