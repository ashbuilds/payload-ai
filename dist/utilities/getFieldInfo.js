import { getFieldBySchemaPath } from './getFieldBySchemaPath.js';
export const getFieldInfo = (collections, schemaPath)=>{
    let fieldInfo = null;
    //TODO: Only run below for enabled collections
    for(const collectionsKey in collections){
        const collection = collections[collectionsKey];
        fieldInfo = getFieldBySchemaPath(collection.config, schemaPath);
        if (fieldInfo) {
            return fieldInfo;
        }
    }
};

//# sourceMappingURL=getFieldInfo.js.map