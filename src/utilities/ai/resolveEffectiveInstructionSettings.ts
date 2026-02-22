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

type ProviderOptionRow = {
  key: string
  type: 'boolean' | 'number' | 'options' | 'text'
  valueBoolean?: boolean
  valueNumber?: number
  valueOptions?: string[]
  valueText?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function getScalarRowValue(row: ProviderOptionRow): boolean | number | string | undefined {
  if (row.type === 'boolean') {
    return typeof row.valueBoolean === 'boolean' ? row.valueBoolean : undefined
  }

  if (row.type === 'number') {
    return typeof row.valueNumber === 'number' && !Number.isNaN(row.valueNumber)
      ? row.valueNumber
      : undefined
  }

  if (row.type === 'options') {
    if (Array.isArray(row.valueOptions) && row.valueOptions.length > 0) {
      return String(row.valueOptions[0])
    }
    return undefined
  }

  if (typeof row.valueText === 'string' && row.valueText.trim() !== '') {
    return row.valueText
  }

  return undefined
}

function normalizeProviderOptionsValues(
  value: unknown,
): Record<string, unknown> | undefined {
  if (isRecord(value)) {
    return value
  }

  if (!Array.isArray(value)) {
    return undefined
  }

  const normalized: Record<string, unknown> = {}

  for (const row of value) {
    if (!row || typeof row !== 'object' || !('key' in row) || !('type' in row)) {
      continue
    }

    const castRow = row as ProviderOptionRow
    if (!castRow.key) {
      continue
    }

    const scalarValue = getScalarRowValue(castRow)
    if (scalarValue !== undefined) {
      normalized[castRow.key] = scalarValue
    }
  }

  return normalized
}

function toProviderOptionRows({
  defaultsForUseCase,
  provider,
  values,
}: {
  defaultsForUseCase: Record<string, unknown>
  provider: string
  values: Record<string, unknown>
}): ProviderOptionRow[] {
  const rows: ProviderOptionRow[] = []
  const optionTypeByKey = new Map<string, ProviderOptionRow['type']>()
  const poField = providerFieldKey(provider)
  const defaultRows = defaultsForUseCase[poField]

  if (Array.isArray(defaultRows)) {
    for (const row of defaultRows) {
      if (
        row &&
        typeof row === 'object' &&
        'key' in row &&
        'type' in row &&
        typeof row.key === 'string' &&
        typeof row.type === 'string'
      ) {
        const type = row.type as ProviderOptionRow['type']
        optionTypeByKey.set(row.key, type)
      }
    }
  }

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) {
      continue
    }

    const configuredType = optionTypeByKey.get(key)
    if (!configuredType && optionTypeByKey.size > 0) {
      continue
    }

    const inferredType: ProviderOptionRow['type'] =
      configuredType ||
      (typeof value === 'boolean'
        ? 'boolean'
        : typeof value === 'number'
          ? 'number'
          : Array.isArray(value)
            ? 'options'
            : 'text')

    if (inferredType === 'boolean') {
      rows.push({
        type: 'boolean',
        key,
        valueBoolean: !!value,
      })
      continue
    }

    if (inferredType === 'number') {
      const numeric = typeof value === 'number' ? value : Number(value)
      if (!Number.isNaN(numeric)) {
        rows.push({
          type: 'number',
          key,
          valueNumber: numeric,
        })
      }
      continue
    }

    if (inferredType === 'options') {
      const options = Array.isArray(value)
        ? value
            .filter(
              (item) =>
                typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean',
            )
            .map((item) => String(item))
        : typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
          ? [String(value)]
          : []

      if (options.length === 0) {
        continue
      }

      rows.push({
        type: 'options',
        key,
        valueOptions: options,
      })
      continue
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      rows.push({
        type: 'text',
        key,
        valueText: String(value),
      })
    }
  }

  return rows
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
    if (key === 'providerOptionsValues') {
      continue
    }

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

  const selectedProvider = effectiveSettings.provider
  const providerOptionValues = normalizeProviderOptionsValues(
    instructionSettings.providerOptionsValues,
  )

  if (typeof selectedProvider === 'string' && providerOptionValues) {
    const poField = providerFieldKey(selectedProvider)
    effectiveSettings[poField] = toProviderOptionRows({
      defaultsForUseCase,
      provider: selectedProvider,
      values: providerOptionValues,
    })
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
