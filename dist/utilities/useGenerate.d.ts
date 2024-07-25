import type { LexicalEditor } from 'lexical';
import type { MenuItems } from '../types.js';
type UseGenerate = {
    lexicalEditor: LexicalEditor;
};
export declare const useGenerate: ({ lexicalEditor }: UseGenerate) => (options?: {
    action: MenuItems;
}) => Promise<void | Response>;
export {};
//# sourceMappingURL=useGenerate.d.ts.map