import { GenerationModels } from '../ai/models/index.js';
import { PromptEditorField } from '../fields/PromptEditorField/PromptEditorField.js';
import { SelectField } from '../fields/SelectField/SelectField.js';
const groupSettings = GenerationModels.reduce((fields, model)=>{
    if (model.settings) {
        fields.push(model.settings);
    }
    return fields;
}, []);
const modelOptions = GenerationModels.map((model)=>{
    return {
        fields: model.fields,
        label: model.name,
        value: model.id
    };
});
export const Instructions = {
    slug: 'instructions',
    access: {
        create: ()=>true,
        read: ()=>true,
        update: ()=>true
    },
    fields: [
        {
            name: 'schema-path',
            type: 'text',
            admin: {
                hidden: true,
                readOnly: true
            },
            unique: true
        },
        {
            name: 'field-type',
            type: 'select',
            admin: {
                hidden: true,
                readOnly: true
            },
            defaultValue: 'text',
            label: 'Field type',
            options: [
                {
                    label: 'text',
                    value: 'text'
                },
                {
                    label: 'textarea',
                    value: 'textarea'
                },
                {
                    label: 'upload',
                    value: 'upload'
                },
                {
                    label: 'richText',
                    value: 'richText'
                }
            ]
        },
        {
            name: 'model-id',
            type: 'select',
            admin: {
                components: {
                    Field: SelectField
                },
                custom: {
                    filterByField: 'field-type',
                    options: modelOptions
                }
            },
            label: 'Model',
            options: modelOptions.map((option)=>{
                return {
                    label: option.label,
                    value: option.value
                };
            }),
            validate: ()=>true
        },
        {
            name: 'prompt',
            type: 'textarea',
            admin: {
                components: {
                    Field: PromptEditorField
                }
            }
        },
        ...groupSettings
    ],
    hooks: {
        beforeChange: [
            (req)=>{
                // console.log('req: ', req)
                if (req.data['openai-gpt-object-settings'].layout?.length === 0) {
                    req.data['openai-gpt-object-settings'].layout = '';
                }
                return req.data;
            }
        ]
    }
};

//# sourceMappingURL=Instructions.js.map