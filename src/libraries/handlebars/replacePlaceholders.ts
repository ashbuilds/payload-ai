import { asyncHandlebars } from './asyncHandlebars.js'

export const replacePlaceholders = (prompt: string, values: object) => {
  return asyncHandlebars.compile(prompt, { trackIds: true })(values)
}
