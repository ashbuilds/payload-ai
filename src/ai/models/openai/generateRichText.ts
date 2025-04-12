import { jsonSchema, streamObject } from 'ai'

import { openai } from './openai.js'

export const generateRichText = async (text: string, options: any = {}) => {
  // console.log('Running handler with prompts:', options.editorSchema)
  const streamResult = await streamObject({
    maxTokens: options.maxTokens || 5000,
    model: openai(options.model, {
      structuredOutputs: true,
    }),
    // onFinish: (result) => {
    //   console.log('Finished generating rich text:', { options, rawResponse: result.rawResponse, result })
    // },
    prompt: text,
    schema: jsonSchema(options.editorSchema),
    system: `${options.system}

RULES:
- Generate original and unique content based on the given topic.
- Strictly adhere to the specified layout and formatting instructions.
- Utilize the provided rich text editor tools for appropriate formatting.
- Ensure the output follows the structure of the sample output object.
- Produce valid JSON with no undefined or null values.

LAYOUT INSTRUCTIONS:
${options.layout}

RICH TEXT EDITOR TOOLS:
- Use appropriate formatting tools such as bold, italic, or underline for emphasis where needed.
- Apply correct heading levels (h1, h2, h3) for hierarchical structure.
- Utilize bullet points or numbered lists as required by the layout.

ADDITIONAL GUIDELINES:
- Ensure coherence and logical flow between all sections.
- Maintain a consistent tone and style throughout the content.
- Use clear and concise language appropriate for the target audience.
`,
  })
  return streamResult.toTextStreamResponse()
}
