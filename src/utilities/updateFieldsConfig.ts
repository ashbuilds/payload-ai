import { CollectionConfig } from 'payload';

type FieldTypes = 'richText' | 'textarea' | 'text' | 'upload';
type AdminProperty = { [key: string]: any };

export const updateFieldsConfig = (config: CollectionConfig, adminProperty: AdminProperty): CollectionConfig => {
  function updateField(field: any): any {
    if (field.type && ['richText', 'textarea', 'text', 'upload'].includes(field.type)) {
      return {
        ...field,
        admin: {
          ...field.admin,
          ...adminProperty,
        },
      };
    }

    if (field.fields) {
      return {
        ...field,
        fields: field.fields.map(updateField),
      };
    }

    if (field.tabs) {
      return {
        ...field,
        tabs: field.tabs.map((tab: any) => ({
          ...tab,
          fields: tab.fields.map(updateField),
        })),
      };
    }

    if (field.blocks) {
      return {
        ...field,
        blocks: field.blocks.map((block: any) => ({
          ...block,
          fields: block.fields.map(updateField),
        })),
      };
    }

    return field;
  }

  return {
    ...config,
    fields: config.fields.map(updateField),
  };
}

// Example usage:
// const updatedConfig = updateFieldsConfig(Posts, { components: { Field: SmartLabel({}) } });

