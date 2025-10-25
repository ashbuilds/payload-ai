import type { SerializedEditorState } from 'lexical';
import { type SanitizedServerEditorConfig } from '@payloadcms/richtext-lexical';
export declare function lexicalToHTML(editorData: SerializedEditorState, editorConfig: SanitizedServerEditorConfig): Promise<string>;
