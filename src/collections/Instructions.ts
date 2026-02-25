import type { CollectionConfig } from 'payload'
import type { PluginConfig } from 'src/types.js'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js'
import { PromptMentionsFeature } from '../fields/PromptEditorField/feature.server.js'
import { applyInstructionDefaultsForDisplay } from '../utilities/ai/resolveEffectiveInstructionSettings.js'
import { pluginCollectionAccess, pluginCollectionAdmin } from './shared.js'

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
  {
    id: 'array',
    name: 'Array Generation',
    fields: ['array'],
  },
]


const providerSelect = {
  name: 'provider',
  type: 'text' as const,
  admin: {
    components: {
      Field: '@ai-stack/payloadcms/ui/DynamicProviderSelect/index.js#DynamicProviderSelect',
    },
  },
  label: 'Provider',
}

const modelSelect = {
  name: 'model',
  type: 'text' as const,
  admin: {
    components: {
      Field: '@ai-stack/payloadcms/ui/DynamicModelSelect/index.js#DynamicModelSelect',
    },
  },
  label: 'Model',
}


const commonTextParams = [
  {
    type: 'row' as const,
    fields: [
      {
        name: 'maxTokens',
        type: 'number' as const,
        admin: {
          placeholder: 'Model Default',
        },
        label: 'Max Tokens',
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

const providerOptionsUIField = {
  name: 'providerOptions',
  type: 'json' as const,
  admin: {
    components: {
      Field: '@ai-stack/payloadcms/ui/InstructionProviderOptions/index.js#InstructionProviderOptions',
    },
  },
  label: 'Provider Options',
}

export const instructionsCollection = (pluginConfig: PluginConfig) =>
  <CollectionConfig>{
    labels: {
      plural: 'Compose Settings',
      singular: 'Compose Setting',
    },
    ...pluginConfig.overrideInstructions,
    slug: PLUGIN_INSTRUCTIONS_TABLE,
    access: {
      ...pluginCollectionAccess,
      ...pluginConfig.overrideInstructions?.access,
    },
    admin: {
      description:
        'Customize how AI interacts with specific fields within your enabled collections.',
      ...pluginCollectionAdmin,
      ...pluginConfig.overrideInstructions?.admin,
      components: {
        beforeList: ['@ai-stack/payloadcms/ui/ConfigDashboard/index.js#ConfigDashboard'],
      },
    },
    fields: [
      {
        name: 'schema-path',
        type: 'text',
        admin: {
          description: "Please don't change this unless you're sure of what you're doing",
          hidden: !pluginConfig.debugging,
        },
        unique: true,
      },
      {
        name: 'field-type',
        type: 'select',
        admin: {
          description: "Please don't change this unless you're sure of what you're doing",
          hidden: !pluginConfig.debugging,
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
          {
            label: 'array',
            value: 'array',
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
          hidden: !pluginConfig.debugging,
        },
        label: 'Relation to',
      },
      {
        name: 'hasMany',
        type: 'checkbox',
        admin: {
          hidden: true,
        },
        defaultValue: false,
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
              path: '@ai-stack/payloadcms/fields/SelectField/SelectField.js#SelectField',
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
        name: 'alwaysShow',
        type: 'checkbox',
        admin: {
          condition: (_, current) => !current.disabled,
          description: 'Compose button will always be visible without requiring field focus',
        },
        defaultValue: false,
        label: 'Always show Compose button',
      },
      {
        name: 'appendGenerated',
        type: 'checkbox',
        admin: {
          condition: (_, current) => current?.hasMany === true && current?.disabled !== true,
          description: 'If enabled, generated values are appended to current values instead of replacing them.',
        },
        defaultValue: false,
        label: 'Append generated values',
      },
      {
        id: 'ai-prompts-tabs',
        type: 'tabs',
        tabs: [
          {
            description:
              'Define dynamic templates using {{ fieldName }}. Type { to see available field suggestions.',
            fields: [
              { // TODO: update below to use PromptField
                name: 'prompt',
                type: 'richText',
                admin: {
                  description: "Click 'Compose' to run this custom prompt and generate content",
                },
                editor: lexicalEditor({
                  features: ({ rootFeatures: _rootFeatures }) => [PromptMentionsFeature()],
                }),
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
          providerOptionsUIField,
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
          providerOptionsUIField,
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
        fields: [providerSelect, modelSelect, providerOptionsUIField],
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
                Field: '@ai-stack/payloadcms/ui/DynamicVoiceSelect/index.js#DynamicVoiceSelect',
              },
            },
            label: 'Voice',
          },
          providerOptionsUIField,
        ],
        label: 'TTS Settings',
      },

      // Array Settings
      {
        name: 'array-settings',
        type: 'group',
        admin: {
          condition: (data) => data['model-id'] === 'array',
        },
        fields: [
          providerSelect,
          modelSelect,
          {
            name: 'count',
            type: 'number',
            admin: {
              description: 'Number of items to generate',
            },
            defaultValue: 3,
            label: 'Items to Generate',
            max: 20,
            min: 1,
          },
          providerOptionsUIField,
        ],
        label: 'Array Settings',
      },
    ],
    hooks: {
      ...pluginConfig.overrideInstructions?.hooks,
      afterRead: [
        ...(pluginConfig.overrideInstructions?.hooks?.afterRead || []),
        async ({ context, doc, req }) => {
          if (!doc || typeof doc !== 'object') {
            return doc
          }

          const cacheKey = '__aiProvidersDefaults'
          const hookContext = (context || {}) as Record<string, unknown>
          let defaults = hookContext[cacheKey] as Record<string, unknown> | undefined

          if (!defaults) {
            try {
              const aiSettings = await req.payload.findGlobal({
                slug: 'ai-providers',
              })
              defaults = (aiSettings?.defaults || {}) as Record<string, unknown>
              hookContext[cacheKey] = defaults
            } catch (_error) {
              return doc
            }
          }

          return applyInstructionDefaultsForDisplay({
            defaults,
            instructions: doc as Record<string, unknown>,
          })
        },
      ],
    },
  }
