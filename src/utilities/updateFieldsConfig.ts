import type { CollectionConfig, Field, GlobalConfig } from 'payload'

interface UpdateFieldsConfig {
  schemaPathMap: Record<string, string>
  updatedCollectionConfig: CollectionConfig | GlobalConfig
}

type FieldWithName = { name: string }
type FieldWithFields = { fields: Field[] }
type FieldWithTabs = { tabs: Array<{ fields?: Field[] }> }
type FieldWithBlocks = { blocks: Array<{ fields: Field[]; slug: string }> }

export const updateFieldsConfig = (
  collectionConfig: CollectionConfig | GlobalConfig,
): UpdateFieldsConfig => {
  let schemaPathMap = {}

  /**
   * Recursively updates field configuration to inject AI components
   * @param field - Payload field to process
   * @param parentPath - Schema path from parent (for nested fields)
   */
  function updateField(field: Field, parentPath = ''): Field {
    const fieldWithName = field as Field & FieldWithName
    const currentPath = parentPath ? `${parentPath}.${fieldWithName.name}` : fieldWithName.name
    const currentSchemaPath = `${collectionConfig.slug}.${currentPath}`

    // Disabled fields/ field types - skip processing
    const admin = field.admin as Record<string, unknown> | undefined
    if (admin?.disabled || admin?.readOnly || admin?.hidden) {
      return field
    }

    // Rows are layout-only constructs and should not add to the schema path (like tabs)
    // Process their nested fields but use parentPath to maintain correct path structure
    if (field.type === 'row' && 'fields' in field) {
      const fieldWithFields = field as Field & FieldWithFields
      return {
        ...field,
        fields: fieldWithFields.fields.map((subField) => updateField(subField, parentPath)),
      } as Field
    }

    // Map field path for global fieldInstructionsMap to load related instructions
    // This is done due to save extra API call to get instructions when Field components are loaded in admin
    // Doing is will only call instructions data when user clicks on settings
    if (field.type && ['richText', 'text', 'textarea', 'upload'].includes(field.type)) {
      const fieldAny = field as Record<string, unknown>
      schemaPathMap = {
        ...schemaPathMap,
        [currentSchemaPath]: {
          type: field.type,
          label: fieldAny.label || fieldWithName.name,
          relationTo: fieldAny.relationTo,
        },
      }
    }

    // Inject AI actions, richText is not included here as it has to be explicitly defined by user
    if (field.type && ['text', 'textarea', 'upload'].includes(field.type)) {
      const customField: Record<string, never> = {}

      // Custom fields don't fully adhere to the Payload schema, making it difficult to
      // determine which components support injecting ComposeField as a Description.
      if (admin?.components) {
        // TODO: If a field already provides its own Description, we still inject our ComposeField
        // by overriding Description. If you need both, consider composing your own wrapper.
        // customField would be used here if needed
      }

      return {
        ...field,
        admin: {
          ...(field.admin as Record<string, unknown>),
          components: {
            ...((admin?.components as Record<string, unknown>) || {}),
            Description: {
              clientProps: {
                schemaPath: currentSchemaPath,
              },
              path: '@ai-stack/payloadcms/fields#ComposeField',
            },
            ...customField,
          },
        },
      } as Field
    }

    // Handle fields with nested fields (group, collapsible, etc.)
    if ('fields' in field && Array.isArray(field.fields)) {
      const fieldWithFields = field as Field & FieldWithFields
      return {
        ...field,
        fields: fieldWithFields.fields.map((subField) => updateField(subField, currentPath)),
      } as Field
    }

    // Handle fields with tabs
    if ('tabs' in field && Array.isArray(field.tabs)) {
      const fieldWithTabs = field as Field & FieldWithTabs
      return {
        ...field,
        tabs: fieldWithTabs.tabs.map((tab) => {
          return {
            ...tab,
            // Tabs are a UI construct and should not add to the schema path
            fields: (tab.fields || []).map((subField) => updateField(subField, parentPath)),
          }
        }),
      } as Field
    }

    // Handle fields with blocks
    if ('blocks' in field && Array.isArray(field.blocks)) {
      const fieldWithBlocks = field as Field & FieldWithBlocks
      return {
        ...field,
        blocks: fieldWithBlocks.blocks.map((block) => ({
          ...block,
          fields: block.fields.map((subField) =>
            updateField(subField, `${currentPath}.${block.slug}`),
          ),
        })),
      } as Field
    }

    return field
  }

  const updatedCollectionConfig = {
    ...collectionConfig,
    fields: collectionConfig.fields.map((field) => updateField(field)),
  }

  return {
    schemaPathMap,
    updatedCollectionConfig,
  }
}
