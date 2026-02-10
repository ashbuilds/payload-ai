export const PLUGIN_NAME = 'plugin-ai'
export const PLUGIN_INSTRUCTIONS_TABLE = `${PLUGIN_NAME}-instructions`
export const PLUGIN_AI_JOBS_TABLE = `${PLUGIN_NAME}-ai-jobs`
export const PLUGIN_LEXICAL_EDITOR_FEATURE = `${PLUGIN_NAME}-actions-feature`

// Endpoint defaults
export const PLUGIN_API_ENDPOINT_BASE = `/${PLUGIN_NAME}`
export const PLUGIN_API_ENDPOINT_GENERATE = `${PLUGIN_API_ENDPOINT_BASE}/generate`
export const PLUGIN_API_ENDPOINT_GENERATE_UPLOAD = `${PLUGIN_API_ENDPOINT_GENERATE}/upload`
export const PLUGIN_FETCH_FIELDS_ENDPOINT = `${PLUGIN_API_ENDPOINT_BASE}/fetch-fields`
export const PLUGIN_API_ENDPOINT_VIDEOGEN_WEBHOOK = `${PLUGIN_API_ENDPOINT_BASE}/videogen/webhook`
export const PLUGIN_API_ENDPOINT_FETCH_VOICES = `${PLUGIN_API_ENDPOINT_BASE}/elevenlabs/fetch-voices`

// LLM Settings
export const PLUGIN_DEFAULT_OPENAI_MODEL = `gpt-4o-mini`
export const PLUGIN_DEFAULT_ANTHROPIC_MODEL = `claude-3-5-sonnet-latest`

export const excludeCollections = [
  'payload-preferences',
  'payload-migrations',
  'payload-locked-documents',
  'ai-providers',
  PLUGIN_INSTRUCTIONS_TABLE,
  PLUGIN_AI_JOBS_TABLE,
]
