import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { PLUGIN_DEFAULT_ANTHROPIC_MODEL, PLUGIN_DEFAULT_OPENAI_MODEL } from '../../defaults.js';
import { openai } from '../models/openai/openai.js';
export const systemGenerate = async (data, generateTextFn)=>{
    const { prompt, system } = data;
    if (generateTextFn) {
        return generateTextFn(prompt, system);
    }
    let model = null;
    // If the generateTextFn is not provided, still need OPENAI_API_KEY or ANTHROPIC_API_KEY to initialize
    if (process.env.OPENAI_API_KEY) {
        model = openai(PLUGIN_DEFAULT_OPENAI_MODEL);
    } else if (process.env.ANTHROPIC_API_KEY) {
        model = anthropic(PLUGIN_DEFAULT_ANTHROPIC_MODEL);
    } else {
        throw new Error('- AI Plugin: Please check your environment variables!');
    }
    const { text } = await generateText({
        model,
        prompt,
        system
    });
    return text;
};

//# sourceMappingURL=systemGenerate.js.map