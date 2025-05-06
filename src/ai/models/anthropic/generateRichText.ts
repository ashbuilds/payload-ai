import { anthropic } from '@ai-sdk/anthropic'
import { jsonSchema, streamObject } from 'ai'

export const generateRichText = (text: string, options: any) => {
  const streamResult = streamObject({
    model: anthropic(options.model),
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
- Double-check that all JSON fields are properly filled and formatted.`,
  })

  return streamResult.toTextStreamResponse()
}
