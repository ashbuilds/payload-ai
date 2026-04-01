import * as process from 'node:process'

import { createOpenAI } from '@ai-sdk/openai'

export const minimax = createOpenAI({
  apiKey: process.env.MINIMAX_API_KEY,
  baseURL: 'https://api.minimax.io/v1',
  name: 'minimax',
})
