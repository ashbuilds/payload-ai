import type { CollectionConfig, GroupField } from 'payload'

import { GenerationModels } from '../ai/models/index.js'
import { PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js'

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

const defaultAccessConfig = {
  create: () => true,
  read: () => true,
  update: () => true,
}

const defaultAdminConfig = {
  group: 'Plugins',
  hidden: true,
}

export const instructionsCollection = (options?: Partial<CollectionConfig>) =>
  <CollectionConfig>{
    slug: PLUGIN_INSTRUCTIONS_TABLE,
    access: {
      ...defaultAccessConfig,
      ...options?.access,
    },
    admin: {
      ...defaultAdminConfig,
      ...options?.admin,
      group: 'Plugins',
    },
    fields: [
      {
        name: 'schema-path',
        type: 'text',
        admin: {
          readOnly: true,
        },
        unique: true,
      },
      {
        name: 'field-type',
        type: 'select',
        admin: {
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
        name: 'relation-to',
        type: 'text',
        admin: {
          condition: (_, current) => {
            return current['field-type'] === 'upload'
          },
        },
        label: 'Relation to',
      },
      {
        name: 'model-id',
        type: 'select',
        admin: {
          components: {
            Field: {
              clientProps: {
                filterByField: 'field-type',
                options: modelOptions,
              },
              path: '@ai-stack/payloadcms/fields#SelectField',
            },
          },
        },
        label: 'Model',
        options: modelOptions.map((option) => {
          return {
            label: option.label,
            value: option.value,
          }
        }),
      },
      {
        id: 'ai-prompts-tabs',
        type: 'tabs',
        tabs: [
          { // TODO: Add some info about the field to guide user
            description: 'The Prompt field allows you to define dynamic templates using placeholders (e.g., {{ fieldName }}) to customize output based on your data fields.',
            fields: [
              {
                name: 'prompt',
                type: 'textarea',
                admin: {
                  components: {
                    Field: '@ai-stack/payloadcms/fields#PromptEditorField',
                  },
                },
                label: '',
              },
            ],
            label: 'Prompt',
          },
          {
            description: '',
            fields: [
              {
                name: 'system',
                type: 'textarea',
                admin: {
                  condition: (_, current) => {
                    return current['field-type'] === 'richText'
                  },
                },
                defaultValue: `INSTRUCTIONS:
You are a highly skilled and professional blog writer,
renowned for crafting engaging and well-organized articles.
When given a title, you meticulously create blogs that are not only
informative and accurate but also captivating and beautifully structured.`,
                label: '',
              },
            ],
            label: 'System prompt',
          },
          {
            // Note: Update when tabs PR is merged: https://github.com/payloadcms/payload/pull/8406
            // admin: {
            //   condition: (_, current) => {
            //     console.log('condition in tab', current)
            //     return current['field-type'] === 'richText'
            //   },
            // },
            description: '',
            fields: [
              {
                /**TODO's:
                 *  - Layouts can be saved in as an array
                 *  - user can add their own layout to collections and use it later for generate specific rich text
                 *  - user can select previously added layout
                 */
                name: 'layout',
                type: 'textarea',
                admin: {
                  condition: (_, current) => {
                    return current['field-type'] === 'richText'
                  },
                },
                defaultValue: `[paragraph] - Write a concise introduction (2-3 sentences) that outlines the main topic.
[horizontalrule] - Insert a horizontal rule to separate the introduction from the main content.
[list] - Create a list with 3-5 items. Each list item should contain:
   a. [heading] - A brief, descriptive heading (up to 5 words)
   b. [paragraph] - A short explanation or elaboration (1-2 sentences)
[horizontalrule] - Insert another horizontal rule to separate the main content from the conclusion.
[paragraph] - Compose a brief conclusion (2-3 sentences) summarizing the key points.
[quote] - Include a relevant quote from a famous person, directly related to the topic. Format: "Quote text." - Author Name`,
                label: '',
              },
            ],
            label: 'Layout',
          },
        ],
      },
      ...groupSettings,
    ],
    labels: {
      plural: 'Compose Settings',
      singular: 'Compose Setting',
    },
  }
