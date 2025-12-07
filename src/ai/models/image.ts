import type { GenerationConfig } from '../../types.js'

export const ImageConfig: GenerationConfig = {
  models: [
    {
      id: 'image',
      name: 'Image Generation',
      fields: ['upload'],
      output: 'image',
      settings: {
        name: 'image-settings',
        type: 'group',
        admin: {
          condition(data: any) {
            return data['model-id'] === 'image'
          },
        },
        fields: [
          {
            name: 'provider',
            type: 'text',
            admin: {
              components: {
                Field: '@ai-stack/payloadcms/client#DynamicProviderSelect',
              },
            },
            defaultValue: 'openai',
            label: 'Provider',
          },
          {
            name: 'model',
            type: 'text',
            admin: {
              components: {
                Field: '@ai-stack/payloadcms/client#DynamicModelSelect',
              },
            },
            defaultValue: 'dall-e-3',
            label: 'Model',
          },
        ],
        label: 'Image Settings',
      },
    },
  ],
  provider: 'Multi-Provider',
}
