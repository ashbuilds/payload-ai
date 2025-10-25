import type { LexicalEditor } from 'lexical';
type EditorAction = 'replace' | 'update';
export declare const setSafeLexicalState: (state: unknown, editorInstance: LexicalEditor, action?: EditorAction) => void;
export {};
