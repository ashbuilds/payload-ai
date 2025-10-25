import * as process from 'node:process';
import { AnthropicConfig } from './anthropic/index.js';
import { ElevenLabsConfig } from './elevenLabs/index.js';
import { OpenAIConfig } from './openai/index.js';
export const defaultGenerationModels = [
    ...process.env.OPENAI_API_KEY ? OpenAIConfig.models : [],
    ...process.env.ANTHROPIC_API_KEY ? AnthropicConfig.models : [],
    ...process.env.ELEVENLABS_API_KEY ? ElevenLabsConfig.models : []
];

//# sourceMappingURL=index.js.map