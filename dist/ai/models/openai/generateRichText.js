import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { DocumentSchema } from '../../RichTextSchema.js';
export const generateRichText = async (text, options)=>{
    const streamResult = await streamObject({
        model: openai(options.model),
        prompt: text,
        schema: DocumentSchema,
        system: `${options.system}

      LAYOUT:
      ${options.layout}
      `
    });
    return streamResult.toTextStreamResponse();
};

//# sourceMappingURL=generateRichText.js.map