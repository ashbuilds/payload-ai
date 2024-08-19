import type { ActionMenuItems } from '../../../types.js';
type ActionCallbackParams = {
    action: ActionMenuItems;
    params?: unknown;
};
export declare const useGenerate: () => {
    generate: (options?: ActionCallbackParams) => Promise<void | Response>;
    isLoading: boolean;
};
export {};
//# sourceMappingURL=useGenerate.d.ts.map