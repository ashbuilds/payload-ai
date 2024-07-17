import { ElevenLabsClient } from 'elevenlabs'

export const getAllVoices = () => {
  const elevenLabs = new ElevenLabsClient()
  return elevenLabs.voices.getAll({
    timeoutInSeconds: 10000,
  })
}
