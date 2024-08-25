import { z } from 'zod';
export function jsonSchemaToZod(schema) {
    switch(schema.type){
        case 'string':
            return z.string();
        case 'number':
            return z.number();
        case 'integer':
            return z.number().int();
        case 'boolean':
            return z.boolean();
        case 'null':
            return z.null();
        case 'array':
            if (schema.items) {
                return z.array(jsonSchemaToZod(schema.items));
            }
            return z.array(z.any());
        case 'object':
            if (schema.properties) {
                const shape = {};
                for (const [key, value] of Object.entries(schema.properties)){
                    shape[key] = jsonSchemaToZod(value);
                }
                return z.object(shape);
            }
            return z.object({});
        default:
            return z.any();
    }
}

//# sourceMappingURL=jsonToZod.js.map