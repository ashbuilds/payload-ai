type MergeGeneratedValueArgs = {
  appendGenerated: boolean
  currentValue: unknown
  generatedValue: unknown
  hasMany: boolean
  max?: number
  maxRows?: number
}

type MergeGeneratedValueResult = {
  truncated: boolean
  value: unknown
}

const toArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value
  }

  if (value === null || value === undefined || value === '') {
    return []
  }

  return [value]
}

export const mergeGeneratedValue = ({
  appendGenerated,
  currentValue,
  generatedValue,
  hasMany,
  max,
  maxRows,
}: MergeGeneratedValueArgs): MergeGeneratedValueResult => {
  if (!appendGenerated || !hasMany) {
    return {
      truncated: false,
      value: generatedValue,
    }
  }

  const current = toArray(currentValue)
  const generated = toArray(generatedValue)

  const merged = [...current, ...generated]
  const limit = typeof maxRows === 'number' ? maxRows : typeof max === 'number' ? max : undefined

  if (typeof limit === 'number' && limit >= 0 && merged.length > limit) {
    return {
      truncated: true,
      value: merged.slice(0, limit),
    }
  }

  return {
    truncated: false,
    value: merged,
  }
}
