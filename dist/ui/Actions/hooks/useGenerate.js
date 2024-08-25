import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client';
import { useConfig, useDocumentInfo, useField, useFieldProps, useForm, useLocale } from '@payloadcms/ui';
import { useCompletion, experimental_useObject as useObject } from 'ai/react';
import { useCallback, useEffect } from 'react';
import { PLUGIN_API_ENDPOINT_GENERATE, PLUGIN_API_ENDPOINT_GENERATE_UPLOAD, PLUGIN_INSTRUCTIONS_TABLE } from '../../../defaults.js';
import { useInstructions } from '../../../providers/InstructionsProvider/hook.js';
import { getFieldBySchemaPath } from '../../../utilities/getFieldBySchemaPath.js';
import { setSafeLexicalState } from '../../../utilities/setSafeLexicalState.js';
import { useHistory } from './useHistory.js';
import { jsonSchemaToZod } from '../../../utilities/jsonToZod.js';
//TODO: DONATION IDEA - Add a url to donate in cli when user installs the plugin and uses it for couple of times.
export const useGenerate = ()=>{
    const { type, path: pathFromContext, schemaPath } = useFieldProps();
    const editorConfigContext = useEditorConfigContext();
    const { editor, focusedEditor } = editorConfigContext;
    const { docConfig } = useDocumentInfo();
    const { setValue } = useField({
        path: pathFromContext
    });
    const { set: setHistory } = useHistory();
    const { id: instructionId } = useInstructions({
        path: schemaPath
    });
    const { getData } = useForm();
    const localFromContext = useLocale();
    const { collections } = useConfig();
    const collection = collections.find((collection)=>collection.slug === PLUGIN_INSTRUCTIONS_TABLE);
    const { custom: { editorConfig } = {} } = collection.admin;
    const { schema: DocumentSchema = {} } = editorConfig || {};
    const zodSchema = jsonSchemaToZod(DocumentSchema);
    const { isLoading: loadingObject, // @ts-ignore - Object execssivily deep issue
    object, stop, submit } = useObject({
        api: `/api${PLUGIN_API_ENDPOINT_GENERATE}`,
        onError: (error)=>{
            console.error('Error generating object:', error);
        },
        onFinish: (result)=>{
            console.log('onFinish: result', result);
            //TODO: Sometimes object is undefined?!
            if (result.object) {
                setHistory(result.object);
                setValue(result.object);
            }
        },
        schema: zodSchema
    });
    useEffect(()=>{
        if (!object) return;
        requestAnimationFrame(()=>{
            if (!editor) {
                setValue(object);
                return;
            }
            // Currently this is being used as setValue for RichText component does not render new changes right away.
            setSafeLexicalState(object, editor);
        });
    }, [
        object
    ]);
    const { complete, completion, isLoading: loadingCompletion } = useCompletion({
        api: `/api${PLUGIN_API_ENDPOINT_GENERATE}`,
        onError: (error)=>{
            console.error('Error generating text:', error);
        },
        onFinish: (prompt, result)=>{
            setHistory(result);
        },
        streamProtocol: 'data'
    });
    useEffect(()=>{
        if (!completion) return;
        requestAnimationFrame(()=>{
            setValue(completion);
        });
    }, [
        completion
    ]);
    const streamObject = useCallback(({ action = 'Compose', params })=>{
        const doc = getData();
        const options = {
            action,
            actionParams: params,
            instructionId
        };
        submit({
            doc,
            locale: localFromContext?.code,
            options
        });
    }, [
        getData,
        localFromContext?.code,
        instructionId
    ]);
    const streamText = useCallback(async ({ action = 'Compose', params })=>{
        const doc = getData();
        const options = {
            action,
            actionParams: params,
            instructionId
        };
        await complete('', {
            body: {
                doc,
                locale: localFromContext?.code,
                options
            }
        });
    }, [
        getData,
        localFromContext?.code,
        instructionId
    ]);
    const generateUpload = useCallback(async ()=>{
        const doc = getData();
        const fieldInfo = getFieldBySchemaPath(docConfig, schemaPath);
        return fetch(`/api${PLUGIN_API_ENDPOINT_GENERATE_UPLOAD}`, {
            body: JSON.stringify({
                doc,
                locale: localFromContext?.code,
                options: {
                    instructionId,
                    uploadCollectionSlug: fieldInfo.relationTo || 'media'
                }
            }),
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST'
        }).then(async (uploadResponse)=>{
            if (uploadResponse.ok) {
                const { result } = await uploadResponse.json();
                if (!result) throw new Error('generateUpload: Something went wrong');
                setValue(result?.id);
                setHistory(result?.id);
            } else {
                const { errors = [] } = await uploadResponse.json();
                const errStr = errors.map((error)=>error.message).join(', ');
                throw new Error(errStr);
            }
            return uploadResponse;
        }).catch((error)=>{
            console.error('Error generating your upload', error);
        });
    }, [
        getData,
        localFromContext?.code,
        instructionId,
        setValue
    ]);
    const generate = useCallback(async (options)=>{
        if (type === 'richText') {
            return streamObject(options);
        }
        if ([
            'text',
            'textarea'
        ].includes(type)) {
            return streamText(options);
        }
        if (type === 'upload') {
            return generateUpload();
        }
    }, [
        generateUpload,
        streamObject,
        streamText,
        type
    ]);
    return {
        generate,
        isLoading: loadingCompletion || loadingObject
    };
};

//# sourceMappingURL=useGenerate.js.map