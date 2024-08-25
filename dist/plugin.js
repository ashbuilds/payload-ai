import { deepMerge } from 'payload/shared';
import { Instructions } from './collections/Instructions.js';
import { PLUGIN_INSTRUCTIONS_MAP_GLOBAL, PLUGIN_NAME } from './defaults.js';
import { endpoints } from './endpoints/index.js';
import { init } from './init.js';
import { InstructionsProvider } from './providers/InstructionsProvider/index.js';
import { translations } from './translations/index.js';
import { updateFieldsConfig } from './utilities/updateFieldsConfig.js';
import { lexicalSchema } from './ai/editor/lexical.schema.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
const payloadAiPlugin = (pluginConfig)=>(incomingConfig)=>{
        // Inject editor schema to config, so that it can be accessed when /textarea endpoint will hit
        const zodLexicalSchema = lexicalSchema(pluginConfig.editorConfig?.nodes);
        if (pluginConfig.debugging) {
            Instructions.admin.hidden = false;
        }
        Instructions.admin.custom = {
            ...Instructions.admin.custom || {},
            [PLUGIN_NAME]: {
                editorConfig: {
                    // Used in admin client for useObject hook
                    schema: zodToJsonSchema(zodLexicalSchema)
                }
            }
        };
        Instructions.custom = {
            ...Instructions.custom || {},
            [PLUGIN_NAME]: {
                editorConfig: {
                    // Used in textarea endpoint for llm
                    schema: zodLexicalSchema
                }
            }
        };
        const collections = [
            ...incomingConfig.collections ?? [],
            Instructions
        ];
        const { collections: collectionSlugs = [] } = pluginConfig;
        let collectionsFieldPathMap = {};
        incomingConfig.admin.components.providers = [
            ...incomingConfig.admin.components.providers ?? [],
            InstructionsProvider
        ];
        const updatedConfig = {
            ...incomingConfig,
            collections: collections.map((collection)=>{
                if (collectionSlugs[collection.slug]) {
                    const { schemaPathMap, updatedCollectionConfig } = updateFieldsConfig(collection);
                    collectionsFieldPathMap = {
                        ...collectionsFieldPathMap,
                        ...schemaPathMap
                    };
                    return updatedCollectionConfig;
                }
                return collection;
            }),
            endpoints: [
                ...incomingConfig.endpoints ?? [],
                endpoints.textarea,
                endpoints.upload
            ],
            globals: [
                ...incomingConfig.globals,
                {
                    slug: PLUGIN_INSTRUCTIONS_MAP_GLOBAL,
                    access: {
                        read: ()=>true
                    },
                    admin: {
                        hidden: !pluginConfig.debugging
                    },
                    fields: [
                        {
                            name: 'map',
                            type: 'json'
                        }
                    ]
                }
            ],
            i18n: {
                ...incomingConfig.i18n,
                translations: {
                    ...deepMerge(translations, incomingConfig.i18n?.translations)
                }
            }
        };
        updatedConfig.onInit = async (payload)=>{
            if (incomingConfig.onInit) await incomingConfig.onInit(payload);
            await init(payload, collectionsFieldPathMap).catch((error)=>{
                payload.logger.error(`— AI Plugin: Initialization Error: ${error}`);
            });
        };
        return updatedConfig;
    };
export { payloadAiPlugin };

//# sourceMappingURL=plugin.js.map