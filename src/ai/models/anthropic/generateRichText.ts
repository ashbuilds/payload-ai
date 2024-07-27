import { anthropic } from '@ai-sdk/anthropic'
import { streamObject } from 'ai'

import { DocumentSchema } from '../../RichTextSchema.js'
import { exampleOutput } from '../example.js'

export const generateRichText = async (text: string, options: any) => {
  const streamResult = await streamObject({
    model: anthropic(options.model),
    prompt: text,
    schema: DocumentSchema,
    system: `${options.system}

      LAYOUT:
      ${options.layout}
      `,
  })

  return streamResult.toTextStreamResponse()
}
