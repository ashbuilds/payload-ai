function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function cloneRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {}
  }

  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

function pruneEmptyObjects(node: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(node)) {
    if (!isRecord(value)) {
      continue
    }

    pruneEmptyObjects(value)
    if (Object.keys(value).length === 0) {
      delete node[key]
    }
  }
}

export function updateProviderOptionsValue({
  currentValue,
  keyPath,
  provider,
  targetValue,
}: {
  currentValue: unknown
  keyPath: string[]
  provider?: string
  targetValue: unknown
}): null | Record<string, unknown> {
  if (!provider || keyPath.length === 0) {
    return isRecord(currentValue) ? cloneRecord(currentValue) : null
  }

  const nextProviderOptions = cloneRecord(currentValue)
  const currentProviderOptions = isRecord(nextProviderOptions[provider])
    ? cloneRecord(nextProviderOptions[provider])
    : {}

  let targetNode = currentProviderOptions
  for (let i = 0; i < keyPath.length - 1; i++) {
    const segment = keyPath[i]
    if (!isRecord(targetNode[segment])) {
      targetNode[segment] = {}
    }
    targetNode = targetNode[segment] as Record<string, unknown>
  }

  const finalKey = keyPath[keyPath.length - 1]
  if (targetValue === undefined) {
    delete targetNode[finalKey]
  } else {
    targetNode[finalKey] = targetValue
  }

  pruneEmptyObjects(currentProviderOptions)

  if (Object.keys(currentProviderOptions).length === 0) {
    delete nextProviderOptions[provider]
  } else {
    nextProviderOptions[provider] = currentProviderOptions
  }

  return Object.keys(nextProviderOptions).length > 0 ? nextProviderOptions : null
}
