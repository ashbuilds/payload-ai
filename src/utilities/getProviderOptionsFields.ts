import type { Block, ClientField, Field } from 'payload'

import { allProviderBlocks } from '../ai/providers/blocks/index.js'

type UseCase = 'text' | 'image' | 'tts' | 'video'

/**
 * Get the provider options field group name for a given use case
 */
function getOptionsGroupName(useCase: UseCase): string {
  return `${useCase}ProviderOptions`
}

/**
 * Find a field by name within a block's fields, searching through tabs
 */
function findFieldInBlock(block: Block, fieldName: string): Field | undefined {
  const searchFields = (fields: Field[]): Field | undefined => {
    for (const field of fields) {
      if ('name' in field && field.name === fieldName) {
        return field
      }
      if (field.type === 'tabs' && 'tabs' in field) {
        for (const tab of field.tabs) {
          const found = searchFields(tab.fields)
          if (found) return found
        }
      }
      if (field.type === 'group' && 'fields' in field) {
        const found = searchFields(field.fields)
        if (found) return found
      }
    }
    return undefined
  }
  
  return searchFields(block.fields)
}

/**
 * Extract provider options fields for a given provider and use case.
 * Returns the inner fields of the {useCase}ProviderOptions group.
 */
export function getProviderOptionsFields(
  providerSlug: string,
  useCase: UseCase
): Field[] {
  const block = allProviderBlocks.find((b) => b.slug === providerSlug)
  if (!block) {
    return []
  }

  const groupName = getOptionsGroupName(useCase)
  const optionsGroup = findFieldInBlock(block, groupName)

  if (optionsGroup && optionsGroup.type === 'group' && 'fields' in optionsGroup) {
    return optionsGroup.fields
  }

  return []
}

/**
 * Get the default values from provider options fields
 */
export function getProviderOptionsDefaults(
  providerSlug: string,
  useCase: UseCase
): Record<string, unknown> {
  const fields = getProviderOptionsFields(providerSlug, useCase)
  const defaults: Record<string, unknown> = {}

  for (const field of fields) {
    if ('name' in field && 'defaultValue' in field && field.defaultValue !== undefined) {
      defaults[field.name] = field.defaultValue
    }
    // Handle nested groups (like voice_settings in ElevenLabs)
    if (field.type === 'group' && 'fields' in field && 'name' in field) {
      const nestedDefaults: Record<string, unknown> = {}
      for (const nestedField of field.fields) {
        if ('name' in nestedField && 'defaultValue' in nestedField && nestedField.defaultValue !== undefined) {
          nestedDefaults[nestedField.name] = nestedField.defaultValue
        }
      }
      if (Object.keys(nestedDefaults).length > 0) {
        defaults[field.name] = nestedDefaults
      }
    }
  }

  return defaults
}

/**
 * Check if a provider supports a given use case
 */
export function providerSupportsUseCase(providerSlug: string, useCase: UseCase): boolean {
  const fields = getProviderOptionsFields(providerSlug, useCase)
  return fields.length > 0
}
