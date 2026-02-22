export type InstructionUseCase = 'image' | 'text' | 'tts' | 'video'

export const providerFieldKey = (providerSlug: string): string =>
  `po_${String(providerSlug).replace(/\W/g, '_')}`

const hasMeaningfulValue = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value === 'string') {
    return value.trim() !== ''
  }

  return true
}

export function getInstructionSettingsName(modelId: unknown): string | undefined {
  if (modelId === 'text') {
    return 'text-settings'
  }
  if (modelId === 'richtext') {
    return 'richtext-settings'
  }
  if (modelId === 'array') {
    return 'array-settings'
  }
  if (modelId === 'image') {
    return 'image-settings'
  }
  if (modelId === 'tts') {
    return 'tts-settings'
  }
  if (modelId === 'video') {
    return 'video-settings'
  }

  return undefined
}

export function getInstructionUseCase(modelId: unknown): InstructionUseCase | undefined {
  if (modelId === 'text' || modelId === 'richtext' || modelId === 'array') {
    return 'text'
  }
  if (modelId === 'image') {
    return 'image'
  }
  if (modelId === 'tts') {
    return 'tts'
  }
  if (modelId === 'video') {
    return 'video'
  }

  return undefined
}

function cloneOptionRows(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value
  }

  return value.map((row) => {
    if (row && typeof row === 'object') {
      return { ...row }
    }
    return row
  })
}

export function resolveEffectiveInstructionSettings({
  defaults,
  instructions,
}: {
  defaults?: Record<string, any>
  instructions: Record<string, any>
}): {
  effectiveSettings: Record<string, unknown>
  settingsName?: string
  useCase?: InstructionUseCase
} {
  const modelId = instructions['model-id']
  const settingsName = getInstructionSettingsName(modelId)
  const useCase = getInstructionUseCase(modelId)

  if (!settingsName || !useCase) {
    return { effectiveSettings: {}, settingsName, useCase }
  }

  const defaultsForUseCase = (defaults?.[useCase] || {}) as Record<string, unknown>
  const instructionSettings = (instructions[settingsName] || {}) as Record<string, unknown>
  const effectiveSettings: Record<string, unknown> = {
    ...defaultsForUseCase,
  }

  for (const [key, value] of Object.entries(instructionSettings)) {
    if (key.startsWith('po_')) {
      if (value !== undefined && value !== null) {
        effectiveSettings[key] = cloneOptionRows(value)
      }
      continue
    }

    if (hasMeaningfulValue(value)) {
      effectiveSettings[key] = value
    }
  }

  return {
    effectiveSettings,
    settingsName,
    useCase,
  }
}

export function applyInstructionDefaultsForDisplay({
  defaults,
  instructions,
}: {
  defaults?: Record<string, any>
  instructions: Record<string, any>
}): Record<string, any> {
  const { settingsName, useCase } = resolveEffectiveInstructionSettings({ defaults, instructions })

  if (!settingsName || !useCase) {
    return instructions
  }

  const defaultsForUseCase = (defaults?.[useCase] || {}) as Record<string, unknown>
  const group = ((instructions[settingsName] || {}) as Record<string, unknown>)
  const updatedGroup: Record<string, unknown> = {
    ...group,
  }

  if (!hasMeaningfulValue(updatedGroup.provider) && hasMeaningfulValue(defaultsForUseCase.provider)) {
    updatedGroup.provider = defaultsForUseCase.provider
  }

  if (!hasMeaningfulValue(updatedGroup.model) && hasMeaningfulValue(defaultsForUseCase.model)) {
    updatedGroup.model = defaultsForUseCase.model
  }

  if (useCase === 'tts' && !hasMeaningfulValue(updatedGroup.voice) && hasMeaningfulValue(defaultsForUseCase.voice)) {
    updatedGroup.voice = defaultsForUseCase.voice
  }

  if (JSON.stringify(group) === JSON.stringify(updatedGroup)) {
    return instructions
  }

  return {
    ...instructions,
    [settingsName]: updatedGroup,
  }
}
