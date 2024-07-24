export declare const generateRichText: (text: string, options: any) => Promise<Response>;
export interface SerializedLexicalNode {
    type: string;
    version: number;
}
export type Spread<T1, T2> = Omit<T2, keyof T1> & T1;
export type SerializedElementNode<T extends SerializedLexicalNode = SerializedLexicalNode> = Spread<{
    children: T[];
    direction: 'ltr' | 'rtl' | null;
    format: ElementFormatType;
    indent: number;
}, SerializedLexicalNode>;
export type SerializedRootNode<T extends SerializedLexicalNode = SerializedLexicalNode> = SerializedElementNode<T>;
export type ElementFormatType = '' | 'center' | 'end' | 'justify' | 'left' | 'right' | 'start';
//# sourceMappingURL=generateRichText.d.ts.map