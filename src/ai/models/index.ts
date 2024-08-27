import * as process from 'node:process'

import type { GenerationModel } from '../../types.js'

import { AnthropicConfig } from './anthropic/index.js'
import { ElevenLabsConfig } from './elevenLabs/index.js'
import { OpenAIConfig } from './openai/index.js'

export const GenerationModels: GenerationModel[] = [
  ...(process.env.ANTHROPIC_API_KEY ? AnthropicConfig.models : []),
  ...(process.env.ELEVENLABS_API_KEY ? ElevenLabsConfig.models : []),
  ...(process.env.OPENAI_API_KEY ? OpenAIConfig.models : []),
]
