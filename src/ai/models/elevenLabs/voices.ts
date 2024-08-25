import { ElevenLabsClient } from 'elevenlabs'
import * as process from 'node:process'

let voicesState = { voices: [] }
export const getAllVoices = async () => {
  if (!process.env.ELEVENLABS_API_KEY) {
    return voicesState
  }

  try {
    const elevenLabs = new ElevenLabsClient()
    if (!voicesState.voices.length) {
      voicesState = await elevenLabs.voices.getAll({
        timeoutInSeconds: 10000,
      })
    }
    return voicesState
  } catch (error) {
    console.error('getAllVoices: ', error)
    return voicesState
  }
}
