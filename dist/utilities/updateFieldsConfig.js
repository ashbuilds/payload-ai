import { DescriptionField } from '../fields/DescriptionField/DescriptionField.js';
export const updateFieldsConfig = (collectionConfig)=>{
    let schemaPathMap = {};
    function updateField(field, parentPath = '') {
        const currentPath = parentPath ? `${parentPath}.${field.name}` : field.name;
        const currentSchemaPath = `${collectionConfig.slug}.${currentPath}`;
        if (field.admin?.disabled || field.admin?.readOnly || field.admin?.hidden) {
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
                    label: field.label || field.name
                }
            };
        }
        // Inject AI actions, richText is not included here as it has to be explicitly defined by user
        if ([
            'text',
            'textarea',
            'upload'
        ].includes(field.type)) {
            return {
                ...field,
                admin: {
                    ...field.admin,
                    components: {
                        ...field.admin?.components || {},
                        // @ts-expect-error
                        Description: DescriptionField({
                            Description: field.admin?.components?.Description
                        })
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
                tabs: field.tabs.map((tab)=>({
                        ...tab,
                        fields: tab.fields.map((subField)=>updateField(subField, currentPath))
                    }))
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