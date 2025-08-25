import { jsonSchema, streamObject } from 'ai'

import { openai } from './openai.js'

export const generateRichText = (text: string, options: any = {}) => {
  console.log("options.layout ", options.layout)
  const streamResult = streamObject({
    maxTokens: options.maxTokens || 5000,
    model: openai(options.model, {
      structuredOutputs: true,
    }),
    onError: (error) => {
      console.error(`generateRichText: `, error)
    },
    prompt: text,
    schema: jsonSchema(options.editorSchema),
    system: `${options.system}

RULES:
- Generate original and unique content based on the given topic.
- Strictly adhere to the specified layout and formatting instructions.
- Utilize the provided rich text editor tools for appropriate formatting.
- Ensure the output follows the structure of the sample output object.
- Produce valid JSON with no undefined or null values.
---
LAYOUT INSTRUCTIONS:
${options.layout}

---
ADDITIONAL GUIDELINES:
- Ensure coherence and logical flow between all sections.
- Maintain a consistent tone and style throughout the content.
- Use clear and concise language appropriate for the target audience.
`,
  })
  return streamResult.toTextStreamResponse()
}
