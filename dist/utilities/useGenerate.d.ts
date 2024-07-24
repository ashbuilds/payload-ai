import { MenuItems } from '../types.js';
import { LexicalEditor } from 'lexical';
type UseGenerate = {
    lexicalEditor: LexicalEditor;
};
export declare const useGenerate: ({ lexicalEditor }: UseGenerate) => (options?: {
    action: MenuItems;
}) => Promise<void | Response>;
export {};
//# sourceMappingURL=useGenerate.d.ts.map