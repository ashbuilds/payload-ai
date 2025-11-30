import type { GenerationModel } from '../../types.js'

import { ImageConfig } from './image.js'
import { TextConfig } from './text.js'
import { TTSConfig } from './tts.js'
import { VideoConfig } from './video.js'

// Build the default model list from unified configs
// Note: We now include all models by default. Availability is checked at runtime
// based on the AI Settings global configuration.
const models: GenerationModel[] = [
  ...TextConfig.models,
  ...ImageConfig.models,
  ...TTSConfig.models,
  ...VideoConfig.models,
]

export const defaultGenerationModels: GenerationModel[] = models
