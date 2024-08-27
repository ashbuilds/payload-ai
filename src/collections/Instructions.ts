import type { CollectionConfig, GroupField } from 'payload'

import { GenerationModels } from '../ai/models/index.js'
import { PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js'
import { PromptEditorField } from '../fields/PromptEditorField/PromptEditorField.js'
import { SelectField } from '../fields/SelectField/SelectField.js'

const groupSettings = GenerationModels.reduce((fields, model) => {
  if (model.settings) {
    fields.push(model.settings)
  }
  return fields
}, [] as GroupField[])

const modelOptions = GenerationModels.map((model) => {
  return {
    fields: model.fields,
    label: model.name,
    value: model.id,
  }
})

export const Instructions: CollectionConfig = {
  slug: PLUGIN_INSTRUCTIONS_TABLE,

  // TODO: Revisit permissions, better if end user can provide this
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
  },
  admin: {
    hidden: true,
  },
  fields: [
    {
      name: 'schema-path',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
      unique: true,
    },
    {
      name: 'field-type',
      type: 'select',
      admin: {
        hidden: true,
        readOnly: true,
      },
      defaultValue: 'text',
      label: 'Field type',
      options: [
        {
          label: 'text',
          value: 'text',
        },
        {
          label: 'textarea',
          value: 'textarea',
        },
        {
          label: 'upload',
          value: 'upload',
        },
        {
          label: 'richText',
          value: 'richText',
        },
      ],
    },
    {
      name: 'model-id',
      type: 'select',
      admin: {
        components: {
          Field: SelectField,
        },
        custom: {
          filterByField: 'field-type',
          options: modelOptions,
        },
      },
      label: 'Model',
      options: modelOptions.map((option) => {
        return {
          label: option.label,
          value: option.value,
        }
      }),
      validate: () => true,
    },
    {
      name: 'prompt',
      type: 'textarea',
      admin: {
        components: {
          Field: PromptEditorField,
        },
      },
    },
    ...groupSettings,
  ],
  hooks: {
    beforeChange: [
      (req) => {
        if (req.data['openai-gpt-object-settings']?.layout?.length === 0) {
          // TODO: why??
          req.data['openai-gpt-object-settings'].layout = ''
        }
        return req.data
      },
    ],
  },
}
