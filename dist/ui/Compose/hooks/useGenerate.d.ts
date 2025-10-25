import type { ActionMenuItems } from '../../../types.js';
type ActionCallbackParams = {
    action: ActionMenuItems;
    params?: unknown;
};
export declare const useGenerate: ({ instructionId }: {
    instructionId: string;
}) => {
    generate: (options?: ActionCallbackParams) => Promise<void | Response>;
    isLoading: boolean;
    stop: () => void;
};
export {};
