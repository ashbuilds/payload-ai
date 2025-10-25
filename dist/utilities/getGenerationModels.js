import { defaultGenerationModels } from '../ai/models/index.js';
export function getGenerationModels(pluginConfig) {
    const { generationModels } = pluginConfig;
    if (typeof generationModels === 'function') {
        return generationModels(defaultGenerationModels);
    }
    return generationModels;
}

//# sourceMappingURL=getGenerationModels.js.map