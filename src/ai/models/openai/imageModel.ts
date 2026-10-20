export const DEFAULT_GPT_IMAGE_MODEL = 'gpt-image-2.5-sunburst'

// Keep saved GPT Image 1 instructions working after its October 23, 2026 shutdown.
export const resolveGPTImageModel = (model: string = DEFAULT_GPT_IMAGE_MODEL): string =>
  model === 'gpt-image-1' ? DEFAULT_GPT_IMAGE_MODEL : model
