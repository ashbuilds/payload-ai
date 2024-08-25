import { PLUGIN_INSTRUCTIONS_MAP_GLOBAL, PLUGIN_INSTRUCTIONS_TABLE } from './defaults.js';
import { GenerationModels } from './ai/models/index.js';
import { generateSeedPrompt } from './ai/utils/generateSeedPrompt.js';
import { seedPrompts } from './ai/prompts.js';
export const init = async (payload, fieldSchemaPaths)=>{
    payload.logger.info(`— AI Plugin: Initializing...`);
    const paths = Object.keys(fieldSchemaPaths);
    // TODO: Add default options according to field type in INSTRUCTIONS table
    const fieldInstructionsMap = {};
    for(let i = 0; i < paths.length; i++){
        const path = paths[i];
        const { type: fieldType, label: fieldLabel } = fieldSchemaPaths[path];
        const entry = await payload.find({
            collection: PLUGIN_INSTRUCTIONS_TABLE,
            where: {
                'field-type': {
                    equals: fieldType
                },
                'schema-path': {
                    equals: path
                }
            }
        });
        if (!entry?.docs?.length) {
            const { system, prompt } = seedPrompts({
                fieldType,
                fieldLabel,
                path,
                fieldSchemaPaths
            });
            const generatedPrompt = await generateSeedPrompt({
                system,
                prompt
            });
            payload.logger.info(`\nPrompt generated for "${fieldLabel}" field:\nprompt: ${generatedPrompt}\n\n`);
            const instructions = await payload.create({
                collection: PLUGIN_INSTRUCTIONS_TABLE,
                data: {
                    'field-type': fieldType,
                    'schema-path': path,
                    'model-id': GenerationModels.find((a)=>{
                        return a.fields.includes(fieldType);
                    }).id,
                    prompt: generatedPrompt
                }
            });
            fieldInstructionsMap[path] = instructions.id;
        } else {
            const [instructions] = entry.docs;
            fieldInstructionsMap[path] = instructions.id;
        }
    }
    payload.logger.info(`— AI Plugin: Enabled fieldMap: ${JSON.stringify(fieldInstructionsMap, null, 2)}`);
    await payload.updateGlobal({
        slug: PLUGIN_INSTRUCTIONS_MAP_GLOBAL,
        data: {
            map: fieldInstructionsMap
        },
        depth: 2
    });
    payload.logger.info(`— AI Plugin: Initialized!`);
    payload.logger.info('\n\n-AI Plugin: Example prompts are added to get you started, Now go break some code 🚀🚀🚀\n\n');
};

//# sourceMappingURL=init.js.map