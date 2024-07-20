import type { CollectionConfig } from 'payload'

import { DescriptionField } from '../fields/DescriptionField/index.js'

interface UpdateFieldsConfig {
  updatedCollectionConfig: CollectionConfig
  schemaPathMap: Record<string, string>
}

export const updateFieldsConfig = (collectionConfig: CollectionConfig): UpdateFieldsConfig => {
  let schemaPathMap = {}
  function updateField(field: any, parentPath = ''): any {
    const currentPath = parentPath ? `${parentPath}.${field.name}` : field.name
    const currentSchemaPath = `${collectionConfig.slug}.${currentPath}`

    if (field.admin?.disabled || field.admin?.readOnly || field.admin?.hidden) {
      return field
    }

    if (field.type && ['richText', 'textarea', 'text', 'upload'].includes(field.type)) {
      schemaPathMap = {
        ...schemaPathMap,
        [currentSchemaPath]: field.type,
      }

      return {
        ...field,
        admin: {
          ...field.admin,
          components: {
            ...field.admin?.components,
            Description: DescriptionField({
              Description: field.admin?.components?.Description,
            }),
          },
        },
      }
    }

    if (field.fields) {
      return {
        ...field,
        fields: field.fields.map((subField: any) => updateField(subField, currentPath)),
      }
    }

    if (field.tabs) {
      return {
        ...field,
        tabs: field.tabs.map((tab: any) => ({
          ...tab,
          fields: tab.fields.map((subField: any) => updateField(subField, currentPath)),
        })),
      }
    }

    if (field.blocks) {
      return {
        ...field,
        blocks: field.blocks.map((block: any) => ({
          ...block,
          fields: block.fields.map((subField: any) =>
            updateField(subField, `${currentPath}.${block.slug}`),
          ),
        })),
      }
    }

    return field
  }

  const updatedCollectionConfig = {
    ...collectionConfig,
    fields: collectionConfig.fields.map((field) => updateField(field)),
  }

  return {
    updatedCollectionConfig,
    schemaPathMap,
  }
}
