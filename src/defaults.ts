export const PLUGIN_NAME = 'plugin-ai'
export const PLUGIN_INSTRUCTIONS_TABLE = `${PLUGIN_NAME}-instructions`
export const PLUGIN_LEXICAL_EDITOR_FEATURE = `${PLUGIN_NAME}-actions-feature`

// Endpoint defaults
export const PLUGIN_API_ENDPOINT_BASE = `/${PLUGIN_NAME}`
export const PLUGIN_API_ENDPOINT_GENERATE = `${PLUGIN_API_ENDPOINT_BASE}/generate`
export const PLUGIN_API_ENDPOINT_GENERATE_UPLOAD = `${PLUGIN_API_ENDPOINT_GENERATE}/upload`
export const PLUGIN_FETCH_FIELDS_ENDPOINT = `${PLUGIN_API_ENDPOINT_BASE}/fetch-fields`

/**
 * Appended to the generation stream when the model stopped at its output token limit, and removed
 * again before the response reaches the AI SDK. A control character is used because it cannot occur
 * in the generated JSON, so the marker can never be confused with content.
 */
export const PLUGIN_TRUNCATED_MARKER = '\u0000'

// LLM Settings
export const PLUGIN_DEFAULT_OPENAI_MODEL = `gpt-4o-mini`
export const PLUGIN_DEFAULT_ANTHROPIC_MODEL = `claude-3-5-sonnet-latest`
