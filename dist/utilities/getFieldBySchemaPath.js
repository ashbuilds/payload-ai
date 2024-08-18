export const getFieldBySchemaPath = (collectionConfig, schemaPath)=>{
    const pathParts = schemaPath.split('.');
    const targetFieldName = pathParts[pathParts.length - 1];
    const findField = (fields, remainingPath)=>{
        for (const field of fields){
            if (remainingPath.length === 1 && field.name === targetFieldName) {
                return field;
            }
            if (field.type === 'group' && field.fields) {
                const result = findField(field.fields, remainingPath.slice(1));
                if (result) return result;
            }
            if (field.type === 'array' && field.fields) {
                const result = findField(field.fields, remainingPath.slice(1));
                if (result) return result;
            }
            if (field.type === 'tabs') {
                for (const tab of field.tabs){
                    const result = findField(tab.fields, remainingPath);
                    if (result) return result;
                }
            }
            if (field.type === 'blocks') {
                for (const block of field.blocks){
                    if (block.slug === remainingPath[0]) {
                        const result = findField(block.fields, remainingPath.slice(1));
                        if (result) return result;
                    }
                }
            }
        }
        return null;
    };
    return findField(collectionConfig.fields, pathParts.slice(1));
};

//# sourceMappingURL=getFieldBySchemaPath.js.map