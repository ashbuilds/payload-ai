import type { CollectionConfig } from 'payload'

import { PLUGIN_AI_JOBS_TABLE, PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js'

const defaultAccessConfig = {
  create: ({ req }: { req: { user?: any } }) => !!req.user,
  delete: ({ req }: { req: { user?: any } }) => !!req.user,
  read: ({ req }: { req: { user?: any } }) => !!req.user,
  update: ({ req }: { req: { user?: any } }) => !!req.user,
}

const defaultAdminConfig = {
  group: 'Plugins',
  hidden: false,
}

export const aiJobsCollection = (): CollectionConfig => ({
  slug: PLUGIN_AI_JOBS_TABLE,
  access: defaultAccessConfig,
  admin: defaultAdminConfig,
  fields: [
    {
      name: 'instructionId',
      type: 'relationship',
      relationTo: PLUGIN_INSTRUCTIONS_TABLE,
      required: true,
    },
    {
      name: 'task_id',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'queued',
      options: [
        { label: 'Queued', value: 'queued' },
        { label: 'Running', value: 'running' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Canceled', value: 'canceled' },
      ],
    },
    {
      name: 'progress',
      type: 'number',
      max: 100,
      min: 0,
    },
    {
      name: 'result_id',
      type: 'text',
    },
    {
      name: 'error',
      type: 'textarea',
    },
    {
      name: 'meta',
      type: 'json',
    },
  ],
  labels: {
    plural: 'AI Jobs',
    singular: 'AI Job',
  },
})
