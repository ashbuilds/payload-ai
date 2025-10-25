export const updateFieldsConfig = (collectionConfig)=>{
    let schemaPathMap = {};
    function updateField(field, parentPath = '') {
        const currentPath = parentPath ? `${parentPath}.${field.name}` : field.name;
        const currentSchemaPath = `${collectionConfig.slug}.${currentPath}`;
        // Disabled fields/ field types
        if (field.admin?.disabled || field.admin?.readOnly || field.admin?.hidden || field.type === 'row') {
            return field;
        }
        // Map field path for global fieldInstructionsMap to load related instructions
        // This is done due to save extra API call to get instructions when Field components are loaded in admin
        // Doing is will only call instructions data when user clicks on settings
        if ([
            'richText',
            'text',
            'textarea',
            'upload'
        ].includes(field.type)) {
            schemaPathMap = {
                ...schemaPathMap,
                [currentSchemaPath]: {
                    type: field.type,
                    label: field.label || field.name,
                    relationTo: field.relationTo
                }
            };
        }
        // Inject AI actions, richText is not included here as it has to be explicitly defined by user
        if ([
            'text',
            'textarea',
            'upload'
        ].includes(field.type)) {
            let customField = {};
            // Custom fields don't fully adhere to the Payload schema, making it difficult to
            // determine which components support injecting ComposeField as a Description.
            if (field.admin?.components?.Field || field.admin?.components?.Description) {
                // TODO: If a field already provides its own Description, we still inject our ComposeField
                // by overriding Description. If you need both, consider composing your own wrapper.
                customField = {};
            }
            return {
                ...field,
                admin: {
                    ...field.admin,
                    components: {
                        ...field.admin?.components || {},
                        Description: {
                            clientProps: {
                                schemaPath: currentSchemaPath
                            },
                            path: '@ai-stack/payloadcms/fields#ComposeField'
                        },
                        ...customField
                    }
                }
            };
        }
        if (field.fields) {
            return {
                ...field,
                fields: field.fields.map((subField)=>updateField(subField, currentPath))
            };
        }
        if (field.tabs) {
            return {
                ...field,
                tabs: field.tabs.map((tab)=>{
                    return {
                        ...tab,
                        // Tabs are a UI construct and should not add to the schema path
                        fields: (tab.fields || []).map((subField)=>updateField(subField, parentPath))
                    };
                })
            };
        }
        if (field.blocks) {
            return {
                ...field,
                blocks: field.blocks.map((block)=>({
                        ...block,
                        fields: block.fields.map((subField)=>updateField(subField, `${currentPath}.${block.slug}`))
                    }))
            };
        }
        return field;
    }
    const updatedCollectionConfig = {
        ...collectionConfig,
        fields: collectionConfig.fields.map((field)=>updateField(field))
    };
    return {
        schemaPathMap,
        updatedCollectionConfig
    };
};

//# sourceMappingURL=updateFieldsConfig.js.map