import type { SpeechCreateParams } from 'openai/resources/audio/speech'

import OpenAI from 'openai'

type OpenAITextToSpeechOptions = Exclude<SpeechCreateParams, 'input'>

export const generateVoice = async (text: string, options: OpenAITextToSpeechOptions) => {
  const openai = new OpenAI()
  const mp3 = await openai.audio.speech.create({
    input: text,
    model: options.model,
    response_format: options.response_format,
    speed: options.speed,
    voice: options.voice,
  })

  if (mp3.ok) {
    const audioBuffer = Buffer.from(await mp3.arrayBuffer())

    return {
      buffer: audioBuffer,
    }
  }
}
