import type { LexicalEditor } from 'lexical';
import type { MenuItems } from '../../../types.js';
type UseGenerate = {
    lexicalEditor: LexicalEditor;
};
export declare const useGenerate: ({ lexicalEditor }: UseGenerate) => {
    generate: (options?: {
        action: MenuItems;
    }) => Promise<void | Response>;
    isLoading: boolean;
};
export {};
//# sourceMappingURL=useGenerate.d.ts.map