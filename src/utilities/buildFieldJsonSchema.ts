/**
 * Build a minimal JSON Schema for AI structured generation based on a Payload field config.
 * We always wrap into an object keyed by the field name so the server can return a single object.
 */
export type JsonSchema = Record<string, any>;

type BasicField = {
  admin?: {
    description?: string;
  };
  hasMany?: boolean;
  maxRows?: number;
  minRows?: number;
  name: string;
  type: string;
};

export const buildFieldJsonSchema = (field: BasicField, fieldName?: string): JsonSchema => {
  const name = fieldName || field.name;
  const description =
    field?.admin?.description && typeof field.admin.description === 'string'
      ? field.admin.description
      : undefined;

  // Only handle text / textarea here as per requirement
  if (field.type === 'text' || field.type === 'textarea') {
    if (field.hasMany) {
      const prop: Record<string, any> = {
        type: 'array',
        items: { type: 'string' },
      };
      if (typeof field.minRows === 'number') {
        prop.minItems = field.minRows;
      }
      if (typeof field.maxRows === 'number') {
        prop.maxItems = field.maxRows;
      }
      if (description) {
        prop.description = description;
      }

      return {
        type: 'object',
        additionalProperties: false,
        properties: {
          [name]: prop,
        },
        required: [name],
      };
    }

    const prop: Record<string, any> = { type: 'string' };
    if (description) {
      prop.description = description;
    }
    return {
      type: 'object',
      additionalProperties: false,
      properties: {
        [name]: prop,
      },
      required: [name],
    };
  }

  // Fallback for unsupported types (should not be used by caller for this task)
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      [name]: { type: 'string' },
    },
    required: [name],
  };
};
