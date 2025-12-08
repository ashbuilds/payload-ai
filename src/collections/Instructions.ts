import type { CollectionConfig } from 'payload'
import type { PluginConfig } from 'src/types.js'

import { PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js'

// Defined capabilities replacing src/ai/models/
const CAPABILITIES = [
  {
    id: 'text',
    name: 'Text Generation',
    fields: ['text', 'textarea'],
  },
  {
    id: 'richtext',
    name: 'Rich Text Generation',
    fields: ['richText'],
  },
  {
    id: 'image',
    name: 'Image Generation',
    fields: ['upload'],
  },
  {
    id: 'tts',
    name: 'Text to Speech',
    fields: ['upload'],
  },
]

const defaultAccessConfig = {
  create: ({ req }: { req: { user?: any } }) => {
    if (!req.user) {
      return false
    }
    return true
  },
  delete: ({ req }: { req: { user?: any } }) => {
    if (!req.user) {
      return false
    }
    return true
  },
  read: ({ req }: { req: { user?: any } }) => {
    if (!req.user) {
      return false
    }
    return true
  },
  update: ({ req }: { req: { user?: any } }) => {
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

const providerSelect = {
  name: 'provider',
  type: 'text' as const,
  admin: {
    components: {
      Field: '@ai-stack/payloadcms/client#DynamicProviderSelect',
    },
  },
  label: 'Provider',
}

const modelSelect = {
  name: 'model',
  type: 'text' as const,
  admin: {
    components: {
      Field: '@ai-stack/payloadcms/client#DynamicModelSelect',
    },
  },
  label: 'Model',
}

const providerOptionsJson = {
  name: 'providerOptions',
  type: 'json' as const,
  admin: {
    components: {
      Field: '@ai-stack/payloadcms/client#ProviderOptionsEditor',
    },
    description: 'Provider-specific options. Defaults are inherited from AI Settings.',
  },
  label: 'Provider Options',
}

const commonTextParams = [
  {
    type: 'row' as const,
    fields: [
      {
        name: 'maxTokens',
        type: 'number' as const,
        label: 'Max Tokens',
        admin: {
          placeholder: 'Model Default',
        },
      },
      {
        name: 'temperature',
        type: 'number' as const,
        defaultValue: 0.7,
        label: 'Temperature',
        max: 1,
        min: 0,
      },
    ],
  },
  {
    name: 'extractAttachments',
    type: 'checkbox' as const,
    label: 'Extract Attachments',
  },
]

export const instructionsCollection = (pluginConfig: PluginConfig) =>
  <CollectionConfig>{
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
      components: {
        beforeList: ['@ai-stack/payloadcms/client#AIConfigDashboard'],
      },
    },
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
                options: CAPABILITIES.map((c) => ({
                  fields: c.fields,
                  label: c.name,
                  value: c.id,
                })),
              },
              path: '@ai-stack/payloadcms/fields#SelectField',
            },
          },
        },
        label: 'Capability',
        options: CAPABILITIES.map((c) => ({
          label: c.name,
          value: c.id,
        })),
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
              condition: (_, current) => {
                return current['field-type'] === 'upload' && current['model-id'] === 'image'
              },
            },
            description:
              'These images will be used to generate new visuals in a similar style, layout, or content.',
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
              condition: (_, current) => {
                return current['field-type'] === 'richText'
              },
            },
            description: '',
            fields: [
              {
                name: 'system',
                type: 'textarea',
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
              condition: (_, current) => {
                return current['field-type'] === 'richText'
              },
            },
            description: '',
            fields: [
              {
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
      
      // Inline Settings Groups by Capability
      
      // Text Settings
      {
        name: 'text-settings',
        type: 'group',
        admin: {
          condition: (data) => data['model-id'] === 'text',
        },
        fields: [
          providerSelect,
          modelSelect,
          ...commonTextParams,
          providerOptionsJson,
        ],
        label: 'Text Settings',
      },
      
      // Rich Text Settings
      {
        name: 'richtext-settings',
        type: 'group',
        admin: {
          condition: (data) => data['model-id'] === 'richtext',
        },
        fields: [
          providerSelect,
          modelSelect,
          ...commonTextParams,
          providerOptionsJson,
        ],
        label: 'Rich Text Settings',
      },
      
      // Image Settings
      {
        name: 'image-settings',
        type: 'group',
        admin: {
          condition: (data) => data['model-id'] === 'image',
        },
        fields: [
          providerSelect,
          modelSelect,
          providerOptionsJson,
        ],
        label: 'Image Settings',
      },
      
      // TTS Settings
      {
        name: 'tts-settings',
        type: 'group',
        admin: {
          condition: (data) => data['model-id'] === 'tts',
        },
        fields: [
          providerSelect,
          modelSelect,
          {
            name: 'voice',
            type: 'text',
            admin: {
              components: {
                Field: '@ai-stack/payloadcms/client#DynamicVoiceSelect',
              },
            },
            label: 'Voice',
          },
          providerOptionsJson,
        ],
        label: 'TTS Settings',
      },
    ],
  }
