import type { LexicalNodeSchema } from '../schemas/lexicalJsonSchema.js';
export declare function filterEditorSchemaByNodes(schema: LexicalNodeSchema, allowedNodes: string[]): {
    definitions: Record<string, any>;
    $schema?: string;
    additionalProperties?: boolean;
    properties: {
        [key: string]: any;
        children?: {
            items: {
                $ref?: string;
                anyOf?: {
                    $ref: string;
                }[];
            };
            type: "array";
        };
        type?: {
            enum: string[];
            type: "string";
        };
    };
    required?: string[];
    type: "object";
    $id?: string | undefined;
    $comment?: string | undefined;
    enum?: import("openai/lib/jsonschema.mjs").JSONSchemaType[] | undefined;
    const?: import("openai/lib/jsonschema.mjs").JSONSchemaType | undefined;
    multipleOf?: number | undefined;
    maximum?: number | undefined;
    exclusiveMaximum?: number | undefined;
    minimum?: number | undefined;
    exclusiveMinimum?: number | undefined;
    maxLength?: number | undefined;
    minLength?: number | undefined;
    pattern?: string | undefined;
    items?: import("openai/lib/jsonschema.mjs").JSONSchemaDefinition | import("openai/lib/jsonschema.mjs").JSONSchemaDefinition[] | undefined;
    additionalItems?: import("openai/lib/jsonschema.mjs").JSONSchemaDefinition | undefined;
    maxItems?: number | undefined;
    minItems?: number | undefined;
    uniqueItems?: boolean | undefined;
    contains?: import("openai/lib/jsonschema.mjs").JSONSchemaDefinition | undefined;
    maxProperties?: number | undefined;
    minProperties?: number | undefined;
    patternProperties?: {
        [key: string]: import("openai/lib/jsonschema.mjs").JSONSchemaDefinition;
    } | undefined;
    propertyNames?: import("openai/lib/jsonschema.mjs").JSONSchemaDefinition | undefined;
    if?: import("openai/lib/jsonschema.mjs").JSONSchemaDefinition | undefined;
    then?: import("openai/lib/jsonschema.mjs").JSONSchemaDefinition | undefined;
    else?: import("openai/lib/jsonschema.mjs").JSONSchemaDefinition | undefined;
    allOf?: import("openai/lib/jsonschema.mjs").JSONSchemaDefinition[] | undefined;
    anyOf?: import("openai/lib/jsonschema.mjs").JSONSchemaDefinition[] | undefined;
    oneOf?: import("openai/lib/jsonschema.mjs").JSONSchemaDefinition[] | undefined;
    not?: import("openai/lib/jsonschema.mjs").JSONSchemaDefinition | undefined;
    format?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    default?: import("openai/lib/jsonschema.mjs").JSONSchemaType | undefined;
    readOnly?: boolean | undefined;
    writeOnly?: boolean | undefined;
    examples?: import("openai/lib/jsonschema.mjs").JSONSchemaType | undefined;
};
