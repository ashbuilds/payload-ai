import { ElevenLabsClient } from 'elevenlabs'

type ElevenLabsTextToSpeechOptions = {
  voice_id: string
}

export const generateVoice = async (text: string, options: ElevenLabsTextToSpeechOptions) => {
  const elevenLabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  })
  const response = (await elevenLabs.textToSpeech.convertWithTimstamps(options.voice_id, {
    ...options,
    text,
  })) as {
    alignment: string[]
    audio_base64: string
  }
  if (response?.audio_base64) {
    const audioBuffer = Buffer.from(response.audio_base64, 'base64')
    // const transcript = convertToTranscript(mp3Audio.alignment)

    return {
      alignment: response.alignment,
      buffer: audioBuffer,
    }
  }
}
