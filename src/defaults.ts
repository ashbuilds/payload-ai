export const PLUGIN_NAME = 'plugin-ai'
export const PLUGIN_INSTRUCTIONS_TABLE = `${PLUGIN_NAME}-instructions`
export const PLUGIN_INSTRUCTIONS_MAP_GLOBAL = `${PLUGIN_NAME}-${PLUGIN_INSTRUCTIONS_TABLE}-map`
export const PLUGIN_LEXICAL_EDITOR_FEATURE = `${PLUGIN_NAME}-actions-feature`

// Endpoint defaults
export const PLUGIN_API_ENDPOINT_BASE = `/${PLUGIN_NAME}`
export const PLUGIN_API_ENDPOINT_GENERATE = `${PLUGIN_API_ENDPOINT_BASE}/generate`
export const PLUGIN_API_ENDPOINT_GENERATE_UPLOAD = `${PLUGIN_API_ENDPOINT_GENERATE}/upload`

// LLM Settings
export const PLUGIN_DEFAULT_OPENAI_MODEL = `gpt-4o-mini`
export const PLUGIN_DEFAULT_ANTHROPIC_MODEL = `claude-3-sonnet-20240229`
