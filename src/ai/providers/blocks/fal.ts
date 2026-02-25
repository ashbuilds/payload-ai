import type { Block } from 'payload'

import { FalIcon } from '../icons.js'

export const falBlock: Block = {
  slug: 'fal',
  fields: [
    {
      type: 'tabs',
      tabs: [
        // 1. Setup tab
        {
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: true,
              label: 'Enabled',
            },
            {
              name: 'apiKey',
              type: 'text',
              admin: {
                components: {
                  Field: '@ai-stack/payloadcms/ui/EncryptedTextField/index.js#EncryptedTextField',
                },
                description: 'Your Fal API key. Will be encrypted in the database.',
              },
              label: 'API Key',
              required: true,
            },
            {
              name: 'webhookSecret',
              type: 'text',
              admin: {
                description: 'Secret for webhook verification (optional)',
              },
              label: 'Webhook Secret',
            },
          ],
          label: 'Setup',
        },

        // 3. Models tab
        {
          fields: [
            {
              name: 'models',
              type: 'array',
              admin: {
                components: {
                  RowLabel: '@ai-stack/payloadcms/ui/ModelRowLabel/index.js#ModelRowLabel',
                },
                initCollapsed: true,
              },
              defaultValue: [
                { id: 'fal-ai/flux-pro', name: 'Flux Pro', enabled: true, useCase: 'image' },
                { id: 'fal-ai/flux/dev', name: 'Flux Dev', enabled: true, useCase: 'image' },
                { id: 'fal-ai/flux/schnell', name: 'Flux Schnell', enabled: true, useCase: 'image' },
                { id: 'fal-ai/flux-realism', name: 'Flux Realism', enabled: true, useCase: 'image' },
                { id: 'fal-ai/minimax-video', name: 'Minimax Video', enabled: true, useCase: 'video' },
                { id: 'fal-ai/hunyuan-video', name: 'Hunyuan Video', enabled: true, useCase: 'video' },
                {
                  id: 'fal-ai/luma-dream-machine',
                  name: 'Luma Dream Machine',
                  enabled: true,
                  useCase: 'video',
                },
              ],
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'id',
                      type: 'text',
                      admin: { width: '33%' },
                      label: 'Model ID',
                      required: true,
                    },
                    {
                      name: 'name',
                      type: 'text',
                      admin: { width: '33%' },
                      label: 'Display Name',
                      required: true,
                    },
                    {
                      name: 'useCase',
                      type: 'select',
                      admin: { width: '33%' },
                      dbName: 'fal-model-useCase',
                      label: 'Use Case',
                      options: [
                        { label: 'Image Generation', value: 'image' },
                        { label: 'Video Generation', value: 'video' },
                      ],
                      required: true,
                    },
                  ],
                },
                {
                  name: 'enabled',
                  type: 'checkbox',
                  admin: {
                    width: '50%',
                  },
                  defaultValue: true,
                  label: 'Enabled',
                },
                {
                  name: 'responseModalities',
                  type: 'select',
                  admin: {
                    description: 'Output capabilities of this model',
                    width: '50%',
                  },
                  dbName: 'fal-model-modalities',
                  hasMany: true,
                  label: 'Response Modalities',
                  options: [
                    { label: 'Text', value: 'TEXT' },
                    { label: 'Image', value: 'IMAGE' },
                    { label: 'Audio', value: 'AUDIO' },
                    { label: 'Video', value: 'VIDEO' },
                  ],
                },
              ],
              label: 'Available Models',
            },
          ],
          label: 'Models',
        },
      ],
    },
  ],
  imageURL: FalIcon,
  labels: {
    plural: 'Fal Providers',
    singular: 'Fal AI',
  },
}
