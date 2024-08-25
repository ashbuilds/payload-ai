import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { exampleOutput } from '../example.js';
export const generateRichText = async (text, options)=>{
    const streamResult = await streamObject({
        model: openai(options.model),
        prompt: text,
        schema: options.editorSchema,
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

SAMPLE OUTPUT OBJECT:
${JSON.stringify(exampleOutput)}

ADDITIONAL GUIDELINES:
- Ensure coherence and logical flow between all sections.
- Maintain a consistent tone and style throughout the content.
- Use clear and concise language appropriate for the target audience.
- Double-check that all JSON fields are properly filled and formatted.`
    });
    return streamResult.toTextStreamResponse();
};

//# sourceMappingURL=generateRichText.js.map