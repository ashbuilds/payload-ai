import * as process from 'node:process'

import type { GenerationModel } from '../../types.js'

import { AnthropicConfig } from './anthropic/index.js'
import { ElevenLabsConfig } from './elevenLabs/index.js'
import { GoogleConfig } from './google/index.js'
import { OpenAIConfig } from './openai/index.js'

export const defaultGenerationModels: GenerationModel[] = [
  ...(process.env.OPENAI_API_KEY ? OpenAIConfig.models : []),
  ...(process.env.ANTHROPIC_API_KEY ? AnthropicConfig.models : []),
  ...(process.env.GOOGLE_GENERATIVE_AI_API_KEY ? GoogleConfig.models : []),
  ...(process.env.ELEVENLABS_API_KEY ? ElevenLabsConfig.models : []),
]
