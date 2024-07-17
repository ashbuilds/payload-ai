import { ElevenLabsClient } from 'elevenlabs'

let voicesState = null;
export const getAllVoices = async () => {
  const elevenLabs = new ElevenLabsClient()
  if (!voicesState) {
    voicesState = await elevenLabs.voices.getAll({
      timeoutInSeconds: 10000,
    })
  }
  return voicesState
}
