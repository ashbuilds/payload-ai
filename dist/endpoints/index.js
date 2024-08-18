import Handlebars from 'handlebars';
import asyncHelpers from 'handlebars-async-helpers';
import { GenerationModels } from '../ai/models/index.js';
import { PLUGIN_API_ENDPOINT_GENERATE, PLUGIN_API_ENDPOINT_GENERATE_UPLOAD, PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js';
import { getFieldBySchemaPath } from '../utilities/getFieldBySchemaPath.js';
import { lexicalToHTML } from '../utilities/lexicalToHTML.js';
const asyncHandlebars = asyncHelpers(Handlebars);
const replacePlaceholders = (prompt, values)=>{
    return asyncHandlebars.compile(prompt, {
        trackIds: true
    })(values);
};
const assignPrompt = async (action, { context, field, template })=>{
    const prompt = await replacePlaceholders(template, context);
    switch(action){
        case 'Compose':
            return {
                prompt,
                system: ''
            };
        case 'Expand':
            return {
                prompt: replacePlaceholders(`{{${field}}}`, context),
                system: `You are a creative writer and subject matter expert. 
        Your task is to expand on the given text, adding depth, detail, 
        and relevant information while maintaining the original tone and style.
        
        -------------
        INSTRUCTIONS:
        - Read the given text carefully to understand its main ideas and tone.
        - Expand the text by adding more details, examples, explanations, or context.
        - Maintain the original tone, style, and intent of the text.
        - Ensure the expanded version flows naturally and coherently.
        - Do not contradict or alter the original meaning or message.
        -------------`
            };
        case 'Proofread':
            return {
                prompt: await replacePlaceholders(`{{${field}}}`, context),
                system: `You are an English language expert. Your task is to carefully proofread the given text, 
      focusing solely on correcting grammar and spelling mistakes. Do not alter the content, 
      style, or tone of the original text in any way.
      
      -------------
      INSTRUCTIONS:
      - Read the text carefully and identify any grammar or spelling errors.
      - Make corrections only to fix grammar and spelling mistakes.
      - Do not change the content, meaning, tone, or style of the original text.
      - Always return the full text, whether corrections were made or not.
      - Do not provide any additional comments or analysis.
      -------------`
            };
        case 'Rephrase':
            return {
                prompt: await replacePlaceholders(`{{${field}}}`, context),
                system: `You are a skilled language expert. Rephrase the given text while maintaining its original meaning, tone, and emotional content. Use different words and sentence structures where possible, but preserve the overall style and sentiment of the original.
        -------------
        INSTRUCTIONS:
        - Follow the instructions below to rephrase the text.
        - Retain the original meaning, tone, and emotional content.
        - Use different vocabulary and sentence structures where appropriate.
        - Ensure the rephrased text conveys the same message and feeling as the original.
        ${prompt ? '- Below is a previous prompt that was used to generate the original text.' : ''}
          ${prompt}
        -------------`
            };
        case 'Simplify':
            return {
                prompt: await replacePlaceholders(`{{${field}}}`, context),
                system: `You are a skilled communicator specializing in clear and concise writing. 
        Your task is to simplify the given text, making it easier to understand while retaining its core message.
        -------------
        INSTRUCTIONS:
        - Read the given text carefully to grasp its main ideas and purpose.
        - Simplify the language, using more common words and shorter sentences.
        - Remove unnecessary details or jargon while keeping essential information.
        - Maintain the original meaning and key points of the text.
        - Aim for clarity and readability suitable for a general audience.
        - The simplified text should be more concise than the original.
        - Follow rules of PREVIOUS PROMPT, if provided.
        
        ${prompt ? `
        PREVIOUS PROMPT:
        ${prompt}
        ` : ''}
        -------------`
            };
        case 'Summarize':
            return {
                prompt: await replacePlaceholders(`{{${field}}}`, context),
                system: ''
            };
        case 'Tone':
            return {
                prompt: await replacePlaceholders(`{{${field}}}`, context),
                system: ''
            };
        case 'Translate':
            return {
                prompt: await replacePlaceholders(`{{${field}}}`, context),
                system: ''
            };
        default:
            return {
                prompt: await replacePlaceholders(template, context),
                system: ''
            };
    }
};
const registerEditorHelper = (payload, schemaPath)=>{
    //TODO: add autocomplete ability using handlebars template on PromptEditorField and include custom helpers in dropdown
    let fieldInfo = getFieldInfo(payload.collections, schemaPath);
    const schemaPathChunks = schemaPath.split('.');
    asyncHandlebars.registerHelper('toLexicalHTML', async function(content, options) {
        const collectionSlug = schemaPathChunks[0];
        const { ids } = options;
        for (const id of ids){
            //TODO: Find a better to get schemaPath of defined field in prompt editor
            const path = `${collectionSlug}.${id}`;
            fieldInfo = getFieldInfo(payload.collections, path);
        }
        const html = await lexicalToHTML(content, fieldInfo.editor?.editorConfig);
        return new asyncHandlebars.SafeString(html);
    });
};
const getFieldInfo = (collections, schemaPath)=>{
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
export const endpoints = {
    textarea: {
        handler: async (req)=>{
            const data = await req.json?.();
            const { locale = 'en', options } = data;
            const { action, instructionId } = options;
            const contextData = data.doc;
            let instructions = {
                'model-id': '',
                prompt: ''
            };
            if (instructionId) {
                // @ts-expect-error
                instructions = await req.payload.findByID({
                    id: instructionId,
                    collection: PLUGIN_INSTRUCTIONS_TABLE
                });
            }
            const { prompt: promptTemplate = '' } = instructions;
            const schemaPath = instructions['schema-path'];
            const fieldName = schemaPath?.split('.').pop();
            registerEditorHelper(req.payload, schemaPath);
            const prompts = await assignPrompt(action, {
                context: contextData,
                field: fieldName,
                template: promptTemplate
            });
            console.log('Running with prompts:', prompts);
            const { defaultLocale, locales = [] } = req.payload.config.localization || {};
            const localeData = locales.find((l)=>{
                return l.code === locale;
            });
            const localeInfo = localeData?.label[defaultLocale] || locale;
            //TODO: remove this
            const opt = {
                locale: localeInfo,
                modelId: instructions['model-id']
            };
            const model = GenerationModels.find((model)=>model.id === opt.modelId);
            const settingsName = model.settings?.name;
            const modelOptions = instructions[settingsName] || {};
            return model.handler?.(prompts.prompt, {
                ...modelOptions,
                ...opt,
                system: prompts.system || modelOptions.system
            }).catch((error)=>{
                console.error('Error: endpoint - generating text:', error);
                return new Response(JSON.stringify(error.message), {
                    status: 500
                });
            });
        },
        method: 'post',
        path: PLUGIN_API_ENDPOINT_GENERATE
    },
    upload: {
        handler: async (req)=>{
            const data = await req.json?.();
            const { options } = data;
            const { instructionId, uploadCollectionSlug } = options;
            const contextData = data.doc;
            let instructions = {
                'model-id': '',
                prompt: ''
            };
            if (instructionId) {
                // @ts-expect-error
                instructions = await req.payload.findByID({
                    id: instructionId,
                    collection: PLUGIN_INSTRUCTIONS_TABLE
                });
            }
            const { prompt: promptTemplate = '' } = instructions;
            const schemaPath = instructions['schema-path'];
            registerEditorHelper(req.payload, schemaPath);
            const text = await replacePlaceholders(promptTemplate, contextData);
            const modelId = instructions['model-id'];
            console.log('prompt text:', text);
            const model = GenerationModels.find((model)=>model.id === modelId);
            const settingsName = model.settings?.name;
            const modelOptions = instructions[settingsName] || {};
            console.log('modelOptions', modelOptions);
            const result = await model.handler?.(text, modelOptions);
            const assetData = await req.payload.create({
                collection: uploadCollectionSlug,
                data: result.data,
                file: result.file
            });
            console.log('assetData', assetData);
            return new Response(JSON.stringify({
                result: {
                    id: assetData.id,
                    alt: assetData.alt
                }
            }));
        },
        method: 'post',
        path: PLUGIN_API_ENDPOINT_GENERATE_UPLOAD
    }
};

//# sourceMappingURL=index.js.map