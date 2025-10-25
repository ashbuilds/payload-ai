import type { ActionPrompt, SeedPromptFunction } from '../types.js';
export declare const defaultSystemPrompt = "IMPORTANT INSTRUCTION:\nProduce only the requested output text.\nDo not add any explanations, comments, or engagement.\nDo not use quotation marks in the response.\nBEGIN OUTPUT:";
export declare const defaultPrompts: ActionPrompt[];
export declare const defaultSeedPrompts: SeedPromptFunction;
