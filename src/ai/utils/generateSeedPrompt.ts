import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { PLUGIN_DEFAULT_MODEL_NAME } from '../../defaults.js'

export const generateSeedPrompt = async (data: { prompt: string; system: string }) => {
  const { prompt, system } = data

  const { text } = await generateText({
    model: openai(PLUGIN_DEFAULT_MODEL_NAME),
    system,
    prompt,
  })

  return text
}
