import { anthropic } from '@ai-sdk/anthropic';
import { streamObject } from 'ai';
import { DocumentSchema } from '../../RichTextSchema.js';
import { exampleOutput } from '../example.js';
export const generateRichText = async (text, options)=>{
    const streamResult = await streamObject({
        model: anthropic(options.model),
        prompt: text,
        schema: DocumentSchema,
        system: `${options.system}

      RULES:
      - Must be original and unique content.
      - Must follow given guidelines and instructions.
      - Always use given tool
      - Must follow rules of sample output object

      SAMPLE OUTPUT OBJECT:
      ${JSON.stringify(exampleOutput)}
      
      LAYOUT:
      ${options.layout}
      `
    });
    return streamResult.toTextStreamResponse();
};

//# sourceMappingURL=generateRichText.js.map