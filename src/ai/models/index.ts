import * as process from 'node:process'

import type { GenerationModel } from '../../types.js'

import { OpenAIImageConfig } from './image-openai.js'
import { TextConfig } from './text.js'
import { TTSConfig } from './tts.js'
import { VideoConfig } from './video.js'
import { VideoGenConfig } from './videogen/index.js'

// Build the default model list from unified configs.
// Notes:
// - Text models available if either OpenAI or Anthropic key is present
// - OpenAI image model requires OPENAI_API_KEY
// - TTS available if OpenAI or ElevenLabs key present
// - Fal video requires FAL_KEY
// - VideoGen legacy is kept if VIDEOGEN_API_URL is set
const models: GenerationModel[] = [
  ...(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY ? TextConfig.models : []),
  ...(process.env.OPENAI_API_KEY ? OpenAIImageConfig.models : []),
  ...(process.env.OPENAI_API_KEY || process.env.ELEVENLABS_API_KEY ? TTSConfig.models : []),
  ...(process.env.FAL_KEY ? VideoConfig.models : []),
  ...(process.env.VIDEOGEN_API_URL ? VideoGenConfig.models : []),
]

export const defaultGenerationModels: GenerationModel[] = models
