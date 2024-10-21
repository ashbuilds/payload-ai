import { openai } from '@ai-sdk/openai'
import { generateObject, jsonSchema, streamObject } from 'ai'

export const generateRichText = async (text: string, options: any) => {

  console.log('generateRichText', text, options)
  const params = {
    model: openai(options.model),
    prompt: text,
    schema: jsonSchema(options.schema),
    system: options.system,
  }

  if (options.stream) {
    const streamResult = await streamObject(params)
    return streamResult.toTextStreamResponse()
  }

  const generateResult = await generateObject(params)
  return Response.json({ text: generateResult.object })
}
