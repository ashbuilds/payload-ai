import type { Block } from 'payload'

import { anthropicBlock } from './anthropic.js'
import { elevenlabsBlock } from './elevenlabs.js'
import { falBlock } from './fal.js'
import { googleBlock } from './google.js'
import { openaiBlock } from './openai.js'
import { openaiCompatibleBlock } from './openai-compatible.js'
import { xaiBlock } from './xai.js'

export const allProviderBlocks: Block[] = [
  openaiBlock,
  anthropicBlock,
  googleBlock,
  xaiBlock,
  elevenlabsBlock,
  falBlock,
  openaiCompatibleBlock,
]
