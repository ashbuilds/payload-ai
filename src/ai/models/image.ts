import type { GenerationConfig } from '../../types.js'

// Placeholder for image generation using the provider registry
// This will be implemented to support multiple providers (OpenAI, Fal, Google, xAI)
export const ImageConfig: GenerationConfig = {
  models: [
    {
      id: 'image',
      name: 'Image Generation',
      fields: ['upload'],
      handler: async (prompt: string, options: any) => {
        // TODO: Implement using provider registry
        // This will support multiple providers through getImageModel()
        throw new Error('Image generation not yet implemented with registry')
      },
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
            type: 'select',
            defaultValue: 'openai',
            label: 'Provider',
            options: ['openai', 'fal', 'google', 'xai'],
          },
          {
            name: 'model',
            type: 'select',
            defaultValue: 'dall-e-3',
            label: 'Model',
            options: [
              'dall-e-3',
              'dall-e-2',
              'fal-ai/flux-pro',
              'fal-ai/flux/dev',
              'imagen-3.0-generate-001',
            ],
          },
        ],
        label: 'Image Settings',
      } as any,
    },
  ],
  provider: 'Multi-Provider',
}
