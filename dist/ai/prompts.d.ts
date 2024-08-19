import type { ActionMenuItems } from '../types.js';
type ActionPrompt = {
    name: ActionMenuItems;
    system: (prompt?: string, systemPrompt?: string, locale?: string) => string;
};
export declare const defaultPrompts: ActionPrompt[];
export {};
//# sourceMappingURL=prompts.d.ts.map