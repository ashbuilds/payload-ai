import * as process from 'node:process'

import type { GenerationModel } from '../../types.js'

import { AnthropicConfig } from './anthropic/index.js'
import { ElevenLabsConfig } from './elevenLabs/index.js'
import { FalVideoConfig } from './fal/index.js'
import { OpenAIConfig } from './openai/index.js'
import { VideoGenConfig } from './videogen/index.js'

export const defaultGenerationModels: GenerationModel[] = [
  ...(process.env.OPENAI_API_KEY ? OpenAIConfig.models : []),
  ...(process.env.ANTHROPIC_API_KEY ? AnthropicConfig.models : []),
...(process.env.ELEVENLABS_API_KEY ? ElevenLabsConfig.models : []),
...(process.env.FAL_KEY ? FalVideoConfig.models : []),
  ...(process.env.VIDEOGEN_API_URL ? VideoGenConfig.models : []),
]
