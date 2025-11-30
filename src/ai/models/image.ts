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
      // Check if the block has a 'models' array field
      const modelsField = block.fields.find((f: any) => f.name === 'models')
      
      // Check if the 'useCase' field within 'models' has 'image' as an option
      const useCaseField = modelsField && 'fields' in modelsField 
        ? (modelsField.fields as any[]).find((f: any) => f.name === 'useCase')
        : undefined
        
      const supportsImage = useCaseField && 'options' in useCaseField 
        ? (useCaseField.options as any[]).some(opt => opt.value === 'image')
        : false

      // Also check default values for backward compatibility or if options check fails
      const defaultModels = modelsField && 'defaultValue' in modelsField ? (modelsField.defaultValue as any[]) : []
      const hasDefaultImageModel = defaultModels.some((m) => m.useCase === 'image')

      return supportsImage || hasDefaultImageModel
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

        if (!prompt || !prompt.trim()) {
          throw new Error('Prompt is required for image generation. Please ensure your Instruction has a prompt template.')
        }

        const model = await getImageModel(req.payload, options.provider, options.model)
        const { experimental_generateImage } = await import('ai')

        const { image } = await experimental_generateImage({
          model,
          n: 1,
          prompt,
        })

        return image.base64
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
      } as any,
    },
  ],
  provider: 'Multi-Provider',
}
