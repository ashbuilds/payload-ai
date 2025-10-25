import type { JSONSchema } from 'openai/lib/jsonschema';
export interface LexicalNodeSchema extends JSONSchema {
    $schema?: string;
    additionalProperties?: boolean;
    definitions?: Record<string, any>;
    properties: {
        [key: string]: any;
        children?: {
            items: {
                $ref?: string;
                anyOf?: {
                    $ref: string;
                }[];
            };
            type: 'array';
        };
        type?: {
            enum: string[];
            type: 'string';
        };
    };
    required?: string[];
    type: 'object';
}
export declare const documentSchema: LexicalNodeSchema;
export declare const lexicalJsonSchema: (customNodes: JSONSchema[] | undefined) => LexicalNodeSchema;
