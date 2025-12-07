import type { Field, Payload } from 'payload'

import { generateObject, generateText } from 'ai'

import { convertPayloadSchemaToZod } from '../utilities/schemaConverter.js'
import { getLanguageModel } from './providers/registry.js'

export type GenerateArgs = {
  mode?: 'auto' | 'json' | 'tool'
  model?: string
  payload: Payload
  prompt: string
  provider?: string
  schema?: Field[]
  system?: string
}

// Use in payload.ai that is injected during payload init. // this will always be non-streaming function, generateText, generateObject, Images etc
export async function generate(args: GenerateArgs) {
  const { mode, model, payload, prompt, provider, schema, system } = args

  const languageModel = await getLanguageModel(payload, provider, model)

  if (schema) {
    const zodSchema = convertPayloadSchemaToZod(schema)
    return generateObject({
      mode: mode || 'auto',
      model: languageModel,
      prompt,
      schema: zodSchema,
      system,
    })
  }

  return generateText({
    model: languageModel,
    prompt,
    system,
  })
}
