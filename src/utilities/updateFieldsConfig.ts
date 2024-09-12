import type { CollectionConfig } from 'payload'

interface UpdateFieldsConfig {
  schemaPathMap: Record<string, string>
  updatedCollectionConfig: CollectionConfig
}

export const updateFieldsConfig = (collectionConfig: CollectionConfig): UpdateFieldsConfig => {
  let schemaPathMap = {}
  let customComponentsFound = false
  function updateField(field: any, parentPath = ''): any {
    const currentPath = parentPath ? `${parentPath}.${field.name}` : field.name
    const currentSchemaPath = `${collectionConfig.slug}.${currentPath}`

    if (field.admin?.disabled || field.admin?.readOnly || field.admin?.hidden) {
      return field
    }

    // Map field path for global fieldInstructionsMap to load related instructions
    // This is done due to save extra API call to get instructions when Field components are loaded in admin
    // Doing is will only call instructions data when user clicks on settings
    if (['richText', 'text', 'textarea', 'upload'].includes(field.type)) {
      schemaPathMap = {
        ...schemaPathMap,
        [currentSchemaPath]: {
          type: field.type,
          label: field.label || field.name,
        },
      }
    }

    // Inject AI actions, richText is not included here as it has to be explicitly defined by user
    if (['text', 'textarea', 'upload'].includes(field.type)) {
      let customField = {}
      if (field.admin?.components?.Field || field.admin?.components?.Description) {
        customComponentsFound = true
      }

      return {
        ...field,
        admin: {
          ...field.admin,
          components: {
            ...(field.admin?.components || {}),
            Description: '@ai-stack/payloadcms/fields#DescriptionField',
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
            fields: tab.fields.map((subField: any) => updateField(subField, tab.name)),
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

  if (customComponentsFound) {
    console.warn(
      `\n— Oops! AI Plugin Alert 🚨:
  Uh-oh, custom component(s) spotted!
  We might not be able to inject the AI Composer automatically 🤖.
  No worries, though! You can add it manually using this path:
  '@ai-stack/payloadcms/fields#DescriptionField'.\n`,
    )
  }

  return {
    schemaPathMap,
    updatedCollectionConfig,
  }
}
