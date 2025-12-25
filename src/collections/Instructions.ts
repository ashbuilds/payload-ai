import type { CollectionConfig, GroupField } from 'payload'
import type { PluginConfig } from 'src/types.js'

import { PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js'
import { getGenerationModels } from '../utilities/getGenerationModels.js'

const groupSettings = (pluginConfig: PluginConfig) =>
  (getGenerationModels(pluginConfig) ?? []).reduce((fields, model) => {
    if (model.settings) {
      fields.push(model.settings)
    }
    return fields
  }, [] as GroupField[])

const modelOptions = (pluginConfig: PluginConfig) =>
  (getGenerationModels(pluginConfig) ?? []).map((model) => {
    return {
      fields: model.fields,
      label: model.name,
      value: model.id,
    }
  })

const defaultAccessConfig = {
  create: ({ req }: { req: { user?: unknown } }) => {
    if (!req.user) {
      return false
    }
    return true
  },
  delete: ({ req }: { req: { user?: unknown } }) => {
    if (!req.user) {
      return false
    }
    return true
  },
  read: ({ req }: { req: { user?: unknown } }) => {
    if (!req.user) {
      return false
    }
    return true
  },
  update: ({ req }: { req: { user?: unknown } }) => {
    if (!req.user) {
      return false
    }
    return true
  },
}

const defaultAdminConfig = {
  group: 'Plugins',
  hidden: true,
}

export const instructionsCollection = (pluginConfig: PluginConfig) => {
  const isLocalized =
    pluginConfig._localization?.enabled && pluginConfig._localization.locales.length > 0

  return <CollectionConfig>{
    labels: {
      plural: 'Compose Settings',
      singular: 'Compose Setting',
    },
    ...pluginConfig.overrideInstructions,
    slug: PLUGIN_INSTRUCTIONS_TABLE,
    access: {
      ...defaultAccessConfig,
      ...pluginConfig.overrideInstructions?.access,
    },
    admin: {
      ...defaultAdminConfig,
      ...pluginConfig.overrideInstructions?.admin,
    },
    ...(isLocalized ? { localization: true } : {}),
    fields: [
      {
        name: 'schema-path',
        type: 'text',
        admin: {
          description: "Please don't change this unless you're sure of what you're doing",
        },
        unique: true,
      },
      {
        name: 'field-type',
        type: 'select',
        admin: {
          description: "Please don't change this unless you're sure of what you're doing",
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
          condition: (_: unknown, current: Record<string, unknown>) => {
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
                options: modelOptions(pluginConfig),
              },
              path: '@ai-stack/payloadcms/fields#SelectField',
            },
          },
        },
        label: 'Model',
        options: modelOptions(pluginConfig).map((option) => {
          return {
            label: option.label,
            value: option.value,
          }
        }),
      },
      {
        name: 'disabled',
        type: 'checkbox',
        admin: {
          description: 'Please reload your collection after applying the changes',
        },
        defaultValue: false,
        label: 'Hide Compose button for this field',
      },
      {
        id: 'ai-prompts-tabs',
        type: 'tabs',
        tabs: [
          {
            description:
              'Define dynamic templates using {{ fieldName }}. Type { to see available field suggestions.',
            fields: [
              {
                name: 'prompt',
                type: 'textarea',
                // Make prompt localized if localization is enabled
                ...(isLocalized ? { localized: true } : {}),
                admin: {
                  components: {
                    Field: '@ai-stack/payloadcms/fields#PromptEditorField',
                  },
                  description: "Click 'Compose' to run this custom prompt and generate content",
                },
                label: '',
              },
            ],
            label: 'Prompt',
          },
          {
            admin: {
              condition: (_: unknown, current: Record<string, unknown>) => {
                return current['field-type'] === 'upload' && current['model-id'] === 'gpt-image-1'
              },
            },
            description:
              'These images will be used to generate new visuals in a similar style, layout, or content. You can combine multiple references for more controlled results.',
            fields: [
              {
                name: 'images',
                type: 'array',
                fields: [
                  {
                    name: 'image',
                    type: 'upload',
                    admin: {
                      description: 'Please make sure the image is publicly accessible.',
                    },
                    relationTo: pluginConfig.uploadCollectionSlug
                      ? pluginConfig.uploadCollectionSlug
                      : 'media',
                  },
                ],
              },
            ],
            label: 'Sample Images',
          },
          {
            admin: {
              condition: (_: unknown, current: Record<string, unknown>) => {
                return current['field-type'] === 'richText'
              },
            },
            description: '',
            fields: [
              {
                name: 'system',
                type: 'textarea',
                ...(isLocalized ? { localized: true } : {}),
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
            admin: {
              condition: (_: unknown, current: Record<string, unknown>) => {
                return current['field-type'] === 'richText'
              },
            },
            description: '',
            fields: [
              {
                /** TODO:
                 *  - Layouts can be saved in as an array
                 *  - User can add their own layout to collections and use it later for generate specific rich text
                 *  - User can select previously added layout
                 *  - IMP: Remove layout from default, this seem to affect other functions like rephrase etc.
                 */
                name: 'layout',
                type: 'textarea',
                ...(isLocalized ? { localized: true } : {}),
                admin: {
                  condition: (_: unknown, current: Record<string, unknown>) => {
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
      ...groupSettings(pluginConfig),
    ],
  }
}
