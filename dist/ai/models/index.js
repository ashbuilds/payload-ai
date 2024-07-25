import { AnthropicConfig } from './anthropic/index.js';
import { ElevenLabsConfig } from './elevenLabs/index.js';
import { OpenAIConfig } from './openai/index.js';
export const GenerationModels = [
    ...AnthropicConfig.models,
    ...ElevenLabsConfig.models,
    ...OpenAIConfig.models
];
export const GenerationModelOptions = GenerationModels.map((model)=>{
    return {
        label: model.name,
        value: model.id
    };
});

//# sourceMappingURL=index.js.map