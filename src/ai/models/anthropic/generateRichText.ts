import { anthropic } from '@ai-sdk/anthropic'
import { streamObject } from 'ai'

export const generateRichText = async (text: string, options: any) => {
  const streamResult = await streamObject({
    model: anthropic(options.model),
    prompt: text,
    schema: options.editorSchema,
    system: `${options.system}

      LAYOUT:
      ${options.layout}
      `,
  })

  return streamResult.toTextStreamResponse()
}
