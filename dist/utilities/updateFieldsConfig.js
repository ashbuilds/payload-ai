import { DescriptionField } from '../fields/DescriptionField/DescriptionField.js';
export const updateFieldsConfig = (collectionConfig)=>{
    let schemaPathMap = {};
    function updateField(field, parentPath = '') {
        const currentPath = parentPath ? `${parentPath}.${field.name}` : field.name;
        const currentSchemaPath = `${collectionConfig.slug}.${currentPath}`;
        if (field.admin?.disabled || field.admin?.readOnly || field.admin?.hidden) {
            return field;
        }
        if (field.type && [
            'richText',
            'text',
            'textarea',
            'upload'
        ].includes(field.type)) {
            schemaPathMap = {
                ...schemaPathMap,
                [currentSchemaPath]: field.type
            };
            return {
                ...field,
                admin: {
                    ...field.admin,
                    components: {
                        ...field.admin?.components,
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