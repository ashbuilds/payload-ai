import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

import {extractPromptAttachments} from "../../../utilities/extractPromptAttachments.js";

export const generateRichText = (text: string, options: any) => {
  const streamResult = streamText({
    maxTokens: options.maxTokens || 5000,
    model: anthropic(options.model),
    onError: (error) => {
      console.error(`generateRichText: `, error)
    },
    prompt: options.extractAttachments ? extractPromptAttachments(text) : text,
    system: `${options.system}

RULES:
- Generate original and unique content based on the given topic.
- Strictly adhere to the specified layout and formatting instructions.
- Use Markdown formatting for rich text elements (headings, bold, italic, lists, links, etc.).
- Output ONLY the content in Markdown format, no JSON or other wrappers.
- Do not include markdown code fences (\`\`\`markdown) in your output.
---
LAYOUT INSTRUCTIONS:
${options.layout}

---
MARKDOWN FORMATTING GUIDELINES:
- Use # for h1, ## for h2, ### for h3 headings
- Use **bold** for emphasis and *italic* for secondary emphasis
- Use - or * for unordered lists, 1. 2. 3. for ordered lists
- Use [text](url) for links
- Use > for blockquotes
- Use \`code\` for inline code and \`\`\` for code blocks
- Ensure coherence and logical flow between all sections.
- Maintain a consistent tone and style throughout the content.
- Use clear and concise language appropriate for the target audience.
`,
    temperature: options.temperature || 0.7,
  })

  return streamResult.toTextStreamResponse()
}
