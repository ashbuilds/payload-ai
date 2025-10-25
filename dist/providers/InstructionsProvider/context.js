'use client';
import { createContext } from 'react';
export const initialContext = {
    debugging: false,
    field: undefined,
    hasInstructions: false,
    instructions: {},
    isConfigAllowed: true,
    path: '',
    promptFields: [],
    schemaPath: ''
};
export const InstructionsContext = createContext(initialContext);

//# sourceMappingURL=context.js.map