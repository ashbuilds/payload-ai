interface LexicalNode {
    [key: string]: any;
    type: string;
}
interface MarkdownBlock {
    content: string;
    items?: string[];
    language?: string;
    level?: number;
    type: 'blockquote' | 'code' | 'heading' | 'list' | 'paragraph';
}
export interface MarkdownDocument {
    blocks: MarkdownBlock[];
}
export declare function convertToLexical(doc: MarkdownDocument): LexicalNode;
export {};
//# sourceMappingURL=convertor.d.ts.map