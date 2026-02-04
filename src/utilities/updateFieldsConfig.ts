import type { CollectionConfig, GlobalConfig } from 'payload'

interface UpdateFieldsConfig {
  schemaPathMap: Record<string, string>
  updatedCollectionConfig: CollectionConfig | GlobalConfig
}

export const updateFieldsConfig = (collectionConfig: CollectionConfig | GlobalConfig): UpdateFieldsConfig => {
  let schemaPathMap = {}

  function updateField(field: any, parentPath = ''): any {
    const currentPath = parentPath ? `${parentPath}.${field.name}` : field.name
    const currentSchemaPath = `${collectionConfig.slug}.${currentPath}`

    // Disabled fields/ field types
    if (
      field.admin?.disabled ||
      field.admin?.readOnly ||
      field.admin?.hidden ||
      field.type === 'row'
    ) {
      return field
    }

    // Map field path for global fieldInstructionsMap to load related instructions
    // This is done due to save extra API call to get instructions when Field components are loaded in admin
    // Doing is will only call instructions data when user clicks on settings
    if (['array', 'richText', 'text', 'textarea', 'upload'].includes(field.type)) {
      schemaPathMap = {
        ...schemaPathMap,
        [currentSchemaPath]: {
          type: field.type,
          label: field.label || field.name,
          relationTo: field.relationTo,
        },
      }
    }

    // Inject AI actions, richText is not included here as it has to be explicitly defined by user
    // Array fields also get AI injection for bulk generation
    if (['array', 'text', 'textarea', 'upload'].includes(field.type)) {
      let customField = {}

      // Custom fields don't fully adhere to the Payload schema, making it difficult to
      // determine which components support injecting ComposeField as a Description.
      if (field.admin?.components?.Field || field.admin?.components?.Description) {
        // TODO: If a field already provides its own Description, we still inject our ComposeField
        // by overriding Description. If you need both, consider composing your own wrapper.
        customField = {}
      }

      // Array fields use ArrayComposeField (always visible) since they don't have focus events
      // Other fields use ComposeField with focus-dependent visibility
      const componentPath = field.type === 'array'
        ? '@ai-stack/payloadcms/fields#ArrayComposeField'
        : '@ai-stack/payloadcms/fields#ComposeField'

      return {
        ...field,
        admin: {
          ...field.admin,
          components: {
            ...(field.admin?.components || {}),
            Description: {
              clientProps: {
                schemaPath: currentSchemaPath,
              },
              path: componentPath,
            },
            ...customField,
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
        tabs: field.tabs.map((tab: any) => {
          return {
            ...tab,
            // Tabs are a UI construct and should not add to the schema path
            fields: (tab.fields || []).map((subField: any) => updateField(subField, parentPath)),
          }
        }),
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
    schemaPathMap,
    updatedCollectionConfig,
  }
}
