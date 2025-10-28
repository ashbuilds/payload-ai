import { jsonSchema, streamObject } from 'ai';

import { extractPromptAttachments } from '../../../utilities/extractPromptAttachments.js';
import { defaultSystemPrompt } from '../../prompts.js';
import { openai } from './openai.js';

/**
 * Generic structured generation for simple object schemas.
 * Expects options.schema to be a valid JSON Schema object.
 */
export const generateObject = (text: string, options: any = {}) => {
  const streamResult = streamObject({
    maxOutputTokens: options.maxTokens || 5000,
    model: openai(options.model),
    onError: (error) => {
      console.error(`generateObject: `, error);
    },
    prompt: options.extractAttachments ? extractPromptAttachments(text) : text,
    schema: jsonSchema(options.schema),
    system: options.system || defaultSystemPrompt,
    temperature: options.temperature || 0.7,
  });

  // Keep return format consistent with other handlers
  return streamResult.toTextStreamResponse();
};
