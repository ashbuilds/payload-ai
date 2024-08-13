import { AnthropicConfig } from './anthropic/index.js';
import { ElevenLabsConfig } from './elevenLabs/index.js';
import { OpenAIConfig } from './openai/index.js';
export const GenerationModels = [
    ...AnthropicConfig.models,
    ...ElevenLabsConfig.models,
    ...OpenAIConfig.models
];

//# sourceMappingURL=index.js.map