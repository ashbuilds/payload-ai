export type InstructionUseCase = 'image' | 'text' | 'tts' | 'video'

const hasMeaningfulValue = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false
  }

  if (typeof value === 'string') {
    return value.trim() !== ''
  }

  return true
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function deepMergeRecords(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base }

  for (const [key, value] of Object.entries(override)) {
    const current = merged[key]
    if (isRecord(current) && isRecord(value)) {
      merged[key] = deepMergeRecords(current, value)
      continue
    }
    merged[key] = value
  }

  return merged
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
    if (key === 'providerOptions') {
      const selectedProvider =
        typeof instructionSettings.provider === 'string'
          ? instructionSettings.provider
          : typeof defaultsForUseCase.provider === 'string'
            ? defaultsForUseCase.provider
            : undefined

      if (selectedProvider && isRecord(value) && isRecord(value[selectedProvider])) {
        const existingOpts = isRecord(effectiveSettings.providerOptions)
          ? effectiveSettings.providerOptions
          : {}
        const existingProviderOpts = isRecord(existingOpts[selectedProvider])
          ? existingOpts[selectedProvider]
          : {}
        const incomingProviderOpts = value[selectedProvider]

        effectiveSettings.providerOptions = {
          ...existingOpts,
          [selectedProvider]: {
            ...deepMergeRecords(existingProviderOpts, incomingProviderOpts),
          },
        }
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
