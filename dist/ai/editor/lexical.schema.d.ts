import { z } from 'zod';
export declare const LexicalBaseNode: z.ZodObject<{
    type: z.ZodString;
    children: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    direction: z.ZodOptional<z.ZodNullable<z.ZodEnum<["ltr"]>>>;
    format: z.ZodOptional<z.ZodString>;
    indent: z.ZodOptional<z.ZodNumber>;
    version: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    children?: any[];
    type?: string;
    direction?: "ltr";
    format?: string;
    indent?: number;
    version?: number;
}, {
    children?: any[];
    type?: string;
    direction?: "ltr";
    format?: string;
    indent?: number;
    version?: number;
}>;
export declare const lexicalSchema: (customNodes?: (typeof LexicalBaseNode)[]) => z.ZodObject<{
    root: any;
}, "strip", z.ZodTypeAny, {
    root?: any;
}, {
    root?: any;
}>;
//# sourceMappingURL=lexical.schema.d.ts.map