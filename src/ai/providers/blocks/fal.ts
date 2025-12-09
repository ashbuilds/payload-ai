import type { Block } from 'payload'

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
                  Field: '@ai-stack/payloadcms/client#EncryptedTextField',
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

        // 2. Provider Options tab
        {
          fields: [
            {
              name: 'imageProviderOptions',
              type: 'group',
              admin: {
                description: 'Default provider options for image generation models.',
              },
              fields: [
                {
                  name: 'num_inference_steps',
                  type: 'number',
                  defaultValue: 28,
                  label: 'Inference Steps',
                  max: 100,
                  min: 1,
                },
                {
                  name: 'guidance_scale',
                  type: 'number',
                  defaultValue: 3.5,
                  label: 'Guidance Scale',
                  max: 20,
                  min: 0,
                },
                {
                  name: 'seed',
                  type: 'number',
                  admin: {
                    description: 'Random seed for reproducible results',
                  },
                  label: 'Seed',
                },
                {
                  name: 'image_size',
                  type: 'select',
                  defaultValue: 'landscape_16_9',
                  label: 'Image Size',
                  options: [
                    { label: 'Square (1:1)', value: 'square' },
                    { label: 'Square HD', value: 'square_hd' },
                    { label: 'Portrait 4:3', value: 'portrait_4_3' },
                    { label: 'Portrait 16:9', value: 'portrait_16_9' },
                    { label: 'Landscape 4:3', value: 'landscape_4_3' },
                    { label: 'Landscape 16:9', value: 'landscape_16_9' },
                  ],
                },
                {
                  name: 'enable_safety_checker',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Enable Safety Checker',
                },
              ],
              label: 'Image Provider Options',
            },
            {
              name: 'videoProviderOptions',
              type: 'group',
              admin: {
                description: 'Default provider options for video generation models.',
              },
              fields: [
                {
                  name: 'duration',
                  type: 'number',
                  defaultValue: 5,
                  label: 'Duration (seconds)',
                  max: 60,
                  min: 1,
                },
                {
                  name: 'aspect_ratio',
                  type: 'select',
                  defaultValue: '16:9',
                  label: 'Aspect Ratio',
                  options: [
                    { label: '16:9', value: '16:9' },
                    { label: '9:16', value: '9:16' },
                    { label: '1:1', value: '1:1' },
                  ],
                },
              ],
              label: 'Video Provider Options',
            },
          ],
          label: 'Provider Options',
        },

        // 3. Models tab
        {
          fields: [
            {
              name: 'models',
              type: 'array',
              admin: {
                components: {
                  RowLabel: '@ai-stack/payloadcms/client#ModelRowLabel',
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
                  defaultValue: true,
                  label: 'Enabled',
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
  imageURL: '/provider-icons/fai-ai.webp',
  labels: {
    plural: 'Fal Providers',
    singular: 'Fal AI',
  },
}

