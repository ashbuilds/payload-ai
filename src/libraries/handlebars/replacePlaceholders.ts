import { asyncHandlebars } from './asyncHandlebars.js'

export const replacePlaceholders = (prompt: string, values: object) => {
  // Sanitize {{ #fieldName }} or {{#fieldName}} to {{ fieldName }}
  // so Handlebars doesn't confuse it for a block helper and throw parse errors.
  // We ignore standard Handlebars block helpers: if, unless, each, with
  const sanitizedPrompt = typeof prompt === 'string'
    ? prompt.replace(/\{\{\s*#\s*(?!if\b|unless\b|each\b|with\b)([\w.]+)\s*\}\}/g, '{{ $1 }}')
    : prompt

  return asyncHandlebars.compile(sanitizedPrompt, { trackIds: true })(values) as Promise<string>
}
