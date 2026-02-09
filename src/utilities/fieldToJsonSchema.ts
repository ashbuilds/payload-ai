/**
 * fieldToJsonSchema
 * Convert a Payload Field (server or client) into a minimal JSON Schema object,
 * wrapped as { type: 'object', properties: { [name]: valueSchema }, required: [...] }
 *
 * Supported types:
 * - text, textarea, select, number, date, code, email, json
 * Arrays are emitted only when field.hasMany is true and the field type supports hasMany
 * (text, textarea, select; for others only if your config truly sets hasMany).
 */
import type { Field } from 'payload'

export type JsonSchema = Record<string, any>;

// Narrowed minimal typing to avoid anywhere possible without pulling the full payload types at runtime.
// In a Payload project, you can import type { Field, ClientField } from 'payload' and use those instead.
type BaseField = {
  admin?: {
    description?: unknown;
    language?: unknown;
  };
  hasMany?: boolean;
  // json
  jsonSchema?: unknown;
  max?: number;
  maxRows?: number;
  // number
  min?: number;
  // text/textarea
  minRows?: number;
  name?: string;
  // select
  options?: Array<
    | {
        label?: unknown;
        value: number | string;
      }
    | number
    | string
  >;
  required?: boolean;
  schema?: unknown;
  type?: string;
  typescriptSchema?: unknown;
};

function isString(s: unknown): s is string {
  return typeof s === 'string';
}

function isPlainObject(o: unknown): o is Record<string, unknown> {
  return !!o && typeof o === 'object' && !Array.isArray(o);
}

function getDescription(field: BaseField): string | undefined {
  const d = field?.admin?.description;
  return typeof d === 'string' ? d : undefined;
}

function stringWithDescription(field: BaseField) {
  const out: Record<string, any> = { type: 'string' };
  const description = getDescription(field);
  if (description) {out.description = description;}
  return out;
}

function numberWithBounds(field: BaseField) {
  const out: Record<string, any> = { type: 'number' };
  if (typeof field.min === 'number') {out.minimum = field.min;}
  if (typeof field.max === 'number') {out.maximum = field.max;}
  const description = getDescription(field);
  if (description) {out.description = description;}
  return out;
}

function dateSchema(field: BaseField) {
  const out: Record<string, any> = { type: 'string', format: 'date-time' };
  const description = getDescription(field);
  if (description) {out.description = description;}
  return out;
}

function codeSchema(field: BaseField) {
  const out: Record<string, any> = { type: 'string' };
  let description = getDescription(field);
  const lang = field?.admin?.language;
  if (typeof lang === 'string' && lang.trim()) {
    description = description ? `${description} (language: ${lang})` : `language: ${lang}`;
  }
  if (description) {out.description = description;}
  return out;
}

function emailSchema(field: BaseField) {
  const out: Record<string, any> = { type: 'string', format: 'email' };
  const description = getDescription(field);
  if (description) {out.description = description;}
  return out;
}

function jsonValueSchema(field: BaseField) {
  // Prefer a provided JSON Schema object
  if (isPlainObject(field.jsonSchema)) {return field.jsonSchema as object;}
  if (isPlainObject(field.schema)) {return field.schema as object;}

  // typescriptSchema cannot be executed here; default to object
  return { type: 'object' };
}

function normalizeSelectOptions(field: BaseField): { values: Array<number | string>; valueType: 'number' | 'string' } {
  const raw = field.options || [];
  const values: Array<number | string> = [];

  for (const opt of raw) {
    if (typeof opt === 'string' || typeof opt === 'number') {
      values.push(opt);
    } else if (isPlainObject(opt) && ('value' in opt)) {
      const v = (opt as any).value;
      if (typeof v === 'string' || typeof v === 'number') {
        values.push(v);
      }
    }
  }

  // Infer primitive type
  const allNumbers = values.length > 0 && values.every((v) => typeof v === 'number');
  const valueType: 'number' | 'string' = allNumbers ? 'number' : 'string';
  return { values, valueType };
}

function supportsHasMany(fieldType: string | undefined): boolean {
  // Out of the box: text, textarea, select support hasMany
  // Others can be arrays only if your config truly sets hasMany; we return boolean based on type here.
  return fieldType === 'text' || fieldType === 'textarea' || fieldType === 'select';
}

export function fieldToJsonSchema(
  fieldInput: BaseField & Field,
  opts?: { nameOverride?: string; wrapObject?: boolean },
): JsonSchema {
  const field = fieldInput || {};
  const name = isString(opts?.nameOverride) && opts?.nameOverride.length ? opts.nameOverride : (field.name || 'value');
  const type = field.type;

  let valueSchema: null | Record<string, any> = null;

  switch (type) {
    case 'array':
    case 'group': {
      if ('fields' in field && Array.isArray(field.fields)) {
        const properties: Record<string, any> = {}
        const required: string[] = []
        
        const processFields = (fields: any[]) => {
          for (const subField of fields) {
            if (subField.type === 'row' || subField.type === 'collapsible') {
               if (subField.fields) {processFields(subField.fields)}
               continue
            }
            if (!subField.name || subField.name === 'id') {continue}

            const subSchema = fieldToJsonSchema(subField, { wrapObject: false })
            if (subSchema && Object.keys(subSchema).length > 0) {
              properties[subField.name] = subSchema
              if (subField.required) {required.push(subField.name)}
            }
          }
        }
        
        processFields(field.fields)

        const objSchema = {
          type: 'object',
          additionalProperties: false,
          properties,
          required: required.length ? required : undefined
        }

        if (type === 'array') {
          valueSchema = {
            type: 'array',
            items: objSchema
          }
        } else {
          valueSchema = objSchema
        }
        
        const description = getDescription(field);
        if (description) {valueSchema.description = description;}
      }
      break;
    }

    case 'checkbox': {
      valueSchema = { type: 'boolean' };
      const description = getDescription(field);
      if (description) {valueSchema.description = description;}
      break;
    }

    case 'code': {
      const base = codeSchema(field);
      if (field.hasMany) {
        valueSchema = { type: 'array', items: base };
      } else {
        valueSchema = base;
      }
      break;
    }

    case 'date': {
      const base = dateSchema(field);
      if (field.hasMany) {
        valueSchema = { type: 'array', items: base };
      } else {
        valueSchema = base;
      }
      break;
    }

    case 'email': {
      const base = emailSchema(field);
      if (field.hasMany) {
        valueSchema = { type: 'array', items: base };
      } else {
        valueSchema = base;
      }
      break;
    }

    case 'json': {
      const base = jsonValueSchema(field);
      if (field.hasMany) {
        valueSchema = { type: 'array', items: base };
      } else {
        valueSchema = base as Record<string, any>;
      }
      break;
    }

    case 'number': {
      const base = numberWithBounds(field);
      if (field.hasMany) {
        valueSchema = { type: 'array', items: base };
      } else {
        valueSchema = base;
      }
      break;
    }
    case 'select': {
      const { values, valueType } = normalizeSelectOptions(field);
      const baseSingle: Record<string, any> = { type: valueType, enum: values };
      const description = getDescription(field);
      if (description) {baseSingle.description = description;}

      if (field.hasMany && supportsHasMany(type)) {
        valueSchema = {
          type: 'array',
          items: { type: valueType, enum: values },
          ...(description ? { description } : {}),
        };
      } else {
        valueSchema = baseSingle;
      }
      break;
    }

    case 'text':
    case 'textarea': {
      const base = stringWithDescription(field);
      if (field.hasMany && supportsHasMany(type)) {
        const arr: Record<string, any> = {
          type: 'array',
          items: { type: 'string' },
        };
        if (typeof field.minRows === 'number') {arr.minItems = field.minRows;}
        if (typeof field.maxRows === 'number') {arr.maxItems = field.maxRows;}
        if (base.description) {arr.description = base.description;}
        valueSchema = arr;
      } else {
        valueSchema = base;
      }
      break;
    }
    
    // Explicitly handle organizational types to avoid default breakage if passed directly
    // though usually they are handled by parent recursion in group/array case above.
    // If passed as root, we can't really return a meaningful single-value schema without a wrapper?
    // But let's leave default for them or handle if necessary. 
    // For now, if someone passes a 'row' as root, it will fall to default (null).

    default: {
      valueSchema = null;
      break;
    }
  }

  const wrap = opts?.wrapObject !== false;

  if (!wrap) {
    return (valueSchema || {}) as JsonSchema;
  }

  if (!valueSchema) {
    return {} as JsonSchema;
  }

  const schema: JsonSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      [name]: valueSchema,
    },
    required: [name]
  };

  return schema;
}
