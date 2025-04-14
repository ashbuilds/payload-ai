import { createOpenAI } from '@ai-sdk/openai'

// same to default openai with optional baseurl.
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  compatibility: 'strict',
})
