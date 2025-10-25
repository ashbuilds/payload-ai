import type { Field } from 'payload';
import type React from 'react';
import type { SerializedPromptField } from '../../types.js';
export type InstructionsContextValue = {
    activeCollection?: string;
    debugging?: boolean;
    enabledLanguages?: string[];
    field?: Field;
    hasInstructions: boolean;
    instructions: Record<string, any>;
    isConfigAllowed: boolean;
    path?: string;
    promptFields: SerializedPromptField[];
    schemaPath?: unknown;
    setActiveCollection?: React.Dispatch<React.SetStateAction<string>>;
};
export declare const initialContext: InstructionsContextValue;
export declare const InstructionsContext: React.Context<InstructionsContextValue>;
