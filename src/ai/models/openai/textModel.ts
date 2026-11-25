// https://developers.openai.com/api/docs/deprecations
// Keep saved instruction values valid while routing retired OpenAI IDs to replacements.
export const OPENAI_TEXT_MODEL_REPLACEMENTS: Record<string, string> = {
  'gpt-3.5-turbo': 'gpt-5.6-terra',
  'gpt-3.5-turbo-0125': 'gpt-5.6-terra',
  'gpt-4-turbo': 'gpt-5.6-sol',
  'gpt-4-turbo-2024-04-09': 'gpt-5.6-sol',
  'gpt-5': 'gpt-5.6-sol',
  'gpt-5-2025-08-07': 'gpt-5.6-sol',
  'gpt-5-mini': 'gpt-5.6-terra',
  'gpt-5-mini-2025-08-07': 'gpt-5.6-terra',
  'gpt-5-nano': 'gpt-5.6-luna',
  'gpt-5-nano-2025-08-07': 'gpt-5.6-luna',
}

export const OPENAI_TEXT_MODELS = [
  'gpt-5.6-sol',
  'gpt-5.6-terra',
  'gpt-5.6-luna',
  'gpt-4.1',
  'gpt-4o',
  'gpt-4o-mini',
]

export const isOpenAIEndpoint = (baseURL?: string): boolean => {
  if (!baseURL) {
    return true
  }
  try {
    return new URL(baseURL).origin === 'https://api.openai.com'
  } catch {
    return false
  }
}

export const resolveOpenAITextModel = (model: string, baseURL?: string): string =>
  isOpenAIEndpoint(baseURL) && Object.hasOwn(OPENAI_TEXT_MODEL_REPLACEMENTS, model)
    ? OPENAI_TEXT_MODEL_REPLACEMENTS[model]
    : model

export const getOpenAITextModelOptions = (baseURL?: string) => [
  ...OPENAI_TEXT_MODELS,
  ...Object.entries(OPENAI_TEXT_MODEL_REPLACEMENTS).map(([value, replacement]) => ({
    label: isOpenAIEndpoint(baseURL) ? `${value} (uses ${replacement})` : value,
    value,
  })),
]
