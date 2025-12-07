import type { MediaResult, SpeechGenerationArgs } from '../types.js'

import { getTTSModel } from '../../../providers/registry.js'
import { getExtensionFromMimeType } from '../utils.js'

/**
 * Generate speech from text using AI SDK's generateSpeech
 */
export async function generateSpeech(args: SpeechGenerationArgs): Promise<MediaResult> {
  const { model: modelId, payload, prompt, provider } = args

  // Get TTS model instance
  const model = await getTTSModel(payload, provider, modelId)
  console.log("model:   ", model)

  // Dynamic import to support older SDK versions
  let generateSpeechFn
  try {
    const ai = await import('ai')
    generateSpeechFn = ai.experimental_generateSpeech
  } catch (_e) {
    throw new Error('generateSpeech not found in "ai" package. Please upgrade to the latest version.')
  }

  if (!generateSpeechFn) {
    throw new Error('generateSpeech not found in "ai" package. Please upgrade to the latest version.')
  }

  // TODO: fix with proper error handling
  try{
  // Generate speech
  const result = await generateSpeechFn({
    model,
    speed: args.speed,
    text: prompt,
    voice: args.voice,
  })
  console.log("result : ", result)
}catch (e) {
    console.error(e)
  }
 // Extract audio from result
  const { audio } = {  } as any
  const mimeType = audio.mediaType || 'audio/mp3'
  
  // Try to get format from audio object, otherwise infer from mime type
  const extension = (audio as any).format || getExtensionFromMimeType(mimeType)

  // Prefer uint8Array if available, else base64
  const dataBuffer = audio.uint8Array
    ? Buffer.from(audio.uint8Array)
    : Buffer.from(audio.base64, 'base64')

  return {
    file: {
      name: `speech.${extension}`,
      data: dataBuffer,
      mimetype: mimeType,
      size: dataBuffer.length,
    },
  }
}
