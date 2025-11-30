import type { GenerationConfig } from '../../types.js'

import { allProviderBlocks } from '../providers/blocks/index.js'
import { getImageModel } from '../providers/index.js'

// Helper to extract models from blocks
const getModelsFromBlocks = (useCase: string) => {
  const models: { label: string; value: string }[] = []
  
  allProviderBlocks.forEach((block) => {
    const providerId = block.slug
    const modelsField = block.fields.find((f: any) => f.name === 'models')
    const defaultModels = modelsField && 'defaultValue' in modelsField ? (modelsField.defaultValue as any[]) : []
    
    defaultModels.forEach((m) => {
      if (m.useCase === useCase) {
        models.push({
          label: `${block.labels?.singular || providerId} - ${m.name}`,
          value: m.id,
        })
      }
    })
  })
  
  return models
}

const getImageProviders = () => {
  return allProviderBlocks
    .filter((block) => {
      const modelsField = block.fields.find((f: any) => f.name === 'models')
      const defaultModels = modelsField && 'defaultValue' in modelsField ? (modelsField.defaultValue as any[]) : []
      return defaultModels.some((m) => m.useCase === 'image')
    })
    .map((block) => ({
      label: typeof block.labels?.singular === 'string' ? block.labels.singular : block.slug,
      value: block.slug,
    }))
}

export const ImageConfig: GenerationConfig = {
  models: [
    {
      id: 'image',
      name: 'Image Generation',
      fields: ['upload'],
      handler: async (prompt: string, options: any) => {
        const { req } = options
        const model = await getImageModel(req.payload, options.provider, options.model)
        
        // TODO: Implement actual generation using the model instance
        // This requires updating the generation logic to handle different SDK responses
        // For now, we just throw to indicate it's not fully wired up yet
        throw new Error('Image generation using registry is pending implementation')
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
            options: getImageProviders(),
          },
          {
            name: 'model',
            type: 'select',
            defaultValue: 'dall-e-3',
            label: 'Model',
            options: getModelsFromBlocks('image'),
          },
        ],
        label: 'Image Settings',
      } as any,
    },
  ],
  provider: 'Multi-Provider',
}
