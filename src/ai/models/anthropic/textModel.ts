// https://platform.claude.com/docs/en/about-claude/model-deprecations
// Keep saved instruction values valid while routing retired Claude IDs to replacements.
export const ANTHROPIC_TEXT_MODEL_REPLACEMENTS: Record<string, string> = {
  'claude-3-5-haiku-latest': 'claude-haiku-4-5',
  'claude-3-5-sonnet-latest': 'claude-sonnet-4-6',
  'claude-3-7-sonnet-latest': 'claude-sonnet-4-6',
  'claude-3-opus-latest': 'claude-opus-4-6',
  'claude-opus-4-0': 'claude-opus-4-6',
  'claude-opus-4-1': 'claude-opus-4-6',
  'claude-sonnet-4-0': 'claude-sonnet-4-6',
}

export const ANTHROPIC_TEXT_MODELS = ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-haiku-4-5']

export const DEFAULT_ANTHROPIC_TEXT_MODEL = 'claude-sonnet-4-6'

export const isAnthropicEndpoint = (baseURL?: string): boolean => {
  if (!baseURL) {
    return true
  }
  try {
    return new URL(baseURL).origin === 'https://api.anthropic.com'
  } catch {
    return false
  }
}

export const resolveAnthropicTextModel = (model: string, baseURL?: string): string =>
  isAnthropicEndpoint(baseURL) && Object.hasOwn(ANTHROPIC_TEXT_MODEL_REPLACEMENTS, model)
    ? ANTHROPIC_TEXT_MODEL_REPLACEMENTS[model]
    : model

export const getAnthropicTextModelOptions = (baseURL?: string) => [
  ...ANTHROPIC_TEXT_MODELS,
  ...Object.entries(ANTHROPIC_TEXT_MODEL_REPLACEMENTS).map(([value, replacement]) => ({
    label: isAnthropicEndpoint(baseURL) ? `${value} (uses ${replacement})` : value,
    value,
  })),
]
