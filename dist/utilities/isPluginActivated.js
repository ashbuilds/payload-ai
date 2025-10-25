import { getGenerationModels } from './getGenerationModels.js';
export const isPluginActivated = (pluginConfig)=>{
    return (getGenerationModels(pluginConfig) ?? []).length > 0;
};

//# sourceMappingURL=isPluginActivated.js.map