import { openai } from '@ai-sdk/openai'
import { streamObject } from 'ai'

import { DocumentSchema } from '../../RichTextSchema.js'
import { exampleOutput } from '../example.js'

export const generateRichText = async (text: string, options: any) => {
  const streamResult = await streamObject({
    model: openai(options.model),
    prompt: text,
    schema: DocumentSchema,
    system: `${options.system}

      LAYOUT:
      ${options.layout}
      `,
  })
  return streamResult.toTextStreamResponse()
}

export interface SerializedLexicalNode {
  type: string
  version: number
}

export type Spread<T1, T2> = Omit<T2, keyof T1> & T1
export type SerializedElementNode<T extends SerializedLexicalNode = SerializedLexicalNode> = Spread<
  {
    children: T[]

    direction: 'ltr' | 'rtl' | null

    format: ElementFormatType

    indent: number
  },
  SerializedLexicalNode
>

export type SerializedRootNode<T extends SerializedLexicalNode = SerializedLexicalNode> =
  SerializedElementNode<T>

export type ElementFormatType = '' | 'center' | 'end' | 'justify' | 'left' | 'right' | 'start'
