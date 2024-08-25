import type { ActionMenuItems } from '../types.js';
type ActionPromptOptions = {
    prompt?: string;
    systemPrompt?: string;
    locale?: string;
    layout?: string;
};
type ActionPrompt = {
    name: ActionMenuItems;
    system: (options: ActionPromptOptions) => string;
    layout?: (options?: ActionPromptOptions) => string;
};
export declare const defaultPrompts: ActionPrompt[];
export declare const seedPrompts: ({ fieldLabel, fieldType, path, fieldSchemaPaths }: {
    fieldLabel: any;
    fieldType: any;
    path: any;
    fieldSchemaPaths: any;
}) => {
    system: string;
    prompt: string;
};
export {};
//# sourceMappingURL=prompts.d.ts.map