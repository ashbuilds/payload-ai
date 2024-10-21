import type { Block, CollectionConfig, GroupField } from 'payload'

import { GenerationModels } from '../ai/models/index.js'
import { PLUGIN_AUTOMATIONS_TABLE, PLUGIN_NAME } from '../defaults.js'

const textModels = GenerationModels.filter((model) => {
  return model.fields.includes('text')
})

const modelsMain = textModels.map((v) => {
  return v.settings
})

const modelSettings: GroupField[] = modelsMain.map((model: GroupField) => {
  return {
    ...model,
    admin: {
      condition: (_, context) => {
        if (model.name === 'anthropic-claude-text-settings') {
          return context['model-id'] === 'anthropic-claude-text'
        }

        if (model.name === 'openai-gpt-text-settings') {
          return context['model-id'] === 'openai-gpt-text'
        }

        return false
      },
    },
  }
})

const requestBlock: Block = {
  slug: 'request',
  fields: [
    {
      name: 'api-url',
      type: 'text',
      label: 'API URL',
    },
    {
      name: 'method',
      type: 'select',
      defaultValue: 'GET',
      label: 'HTTP Method',
      options: ['GET', 'POST', 'PUT', 'DELETE'],
    },
    {
      name: 'headers',
      type: 'array',
      fields: [
        {
          name: 'key',
          type: 'text',
          label: 'Key',
        },
        {
          name: 'value',
          type: 'text',
          label: 'Value',
        },
      ],
      label: '',
      labels: {
        plural: 'headers',
        singular: 'header',
      },
    },
    {
      type: 'collapsible',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'response',
          type: 'code',
          label: '',
        },
      ],
      label: 'Response',
    },
  ],
}

const sentimentAnalysisBlock: Block = {
  slug: 's-analysis',
  fields: [
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'analysisDepth',
      type: 'select',
      options: ['basic', 'detailed'],
    },
    {
      name: 'includeKeyAspects',
      type: 'checkbox',
    },
    {
      type: 'collapsible',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'response',
          type: 'code',
          admin: {
            style: {
              minHeight: '200px',
            },
          },
          label: '',
        },
      ],
      label: 'Response',
    },
  ],
  interfaceName: 'Sentiment Analysis',
  labels: {
    plural: 'Sentiment Analysis',
    singular: 'Sentiments Analysis',
  },
}

const textClassificationBlock: Block = {
  slug: 'text-classification',
  dbName: `${PLUGIN_NAME}-text-classify`,
  fields: [
    {
      name: 'model-id',
      type: 'select',
      dbName: `${PLUGIN_NAME}-models`,
      label: 'Model',
      options: textModels.map((v) => ({ label: v.name, value: v.id })),
    },
    ...modelSettings,
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'categories',
      type: 'array',
      fields: [
        {
          name: 'category',
          type: 'text',
        },
      ],
    },
    {
      name: 'maxCategories',
      type: 'number',
      max: 5,
      min: 1,
    },
    {
      name: 'includeConfidence',
      type: 'checkbox',
    },
    {
      type: 'collapsible',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'response',
          type: 'code',
          admin: {
            style: {
              minHeight: '200px',
            },
          },
          label: '',
        },
      ],
      label: 'Response',
    },
  ],
  interfaceName: 'Text Classification',
  labels: {
    plural: 'Text Classifications',
    singular: 'Text Classification',
  },
}

const composeBlock: Block = {
  slug: 'compose',
  fields: [
    {
      name: 'collection',
      type: 'select',
      options: ['posts'],
    },
    {
      name: 'prompt',
      type: 'textarea',
    },
    {
      name: 'fields',
      type: 'relationship',
      filterOptions: (dat) => {
        // this will be based on selection collection
        // console.log('filterOptions - > ',dat)

        return true
      },
      hasMany: true,
      relationTo: 'plugin-ai-instructions',
    },
    {
      name: 'style-reference',
      type: 'textarea',
    },
    {
      name: 'include-images',
      type: 'checkbox',
      label: 'Include source images',
    },
  ],
}

export const Automations: CollectionConfig = {
  slug: PLUGIN_AUTOMATIONS_TABLE,
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
  },
  admin: {
    components: {
      edit: {
        PreviewButton: {
          path: '@ai-stack/payloadcms/client#RunButton',
        },
      },
    },
    preview: () => {
      console.log('preview')
      return ''
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'schedule',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'frequency',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      options: ['daily', 'weekly', 'monthly'],
    },
    {
      name: 'interval',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 1,
      max: 30,
      min: 1,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'prompt',
              type: 'textarea',
            },
          ],
          label: 'Job',
        },
        {
          fields: [
            {
              name: 'tasks',
              type: 'blocks',
              blocks: [
                requestBlock,
                textClassificationBlock,
                sentimentAnalysisBlock,
                composeBlock,
                // {
                //   slug: 'writing-style-reference', //TODO add this when you will work on content generation block
                // }
              ],
              label: '',
              labels: {
                plural: 'tasks',
                singular: 'task',
              },
            },
          ],
          label: 'Tasks',
        },
      ],
    },
  ],
}
