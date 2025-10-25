import { PLUGIN_FETCH_FIELDS_ENDPOINT, PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js';
export const fetchFields = (config)=>{
    const { access, options = {}, promptFields = [] } = config;
    return {
        handler: async (req)=>{
            const { docs = [] } = await req.payload.find({
                collection: PLUGIN_INSTRUCTIONS_TABLE,
                pagination: false
            });
            let isConfigAllowed = true // Users allowed to update prompts by default
            ;
            if (access?.settings) {
                try {
                    isConfigAllowed = await access.settings({
                        req
                    });
                } catch (e) {
                    req.payload.logger.error(req, 'Please check your "access.settings" for request');
                }
            }
            const fieldMap = {};
            docs.forEach((doc)=>{
                fieldMap[doc['schema-path']] = {
                    id: doc.id,
                    disabled: !!doc['disabled'],
                    fieldType: doc['field-type']
                };
            });
            return Response.json({
                ...options,
                debugging: config.debugging,
                fields: fieldMap,
                isConfigAllowed,
                promptFields: promptFields.map(({ getter: _getter, ...field })=>{
                    return field;
                })
            });
        },
        method: 'get',
        path: PLUGIN_FETCH_FIELDS_ENDPOINT
    };
};

//# sourceMappingURL=fetchFields.js.map