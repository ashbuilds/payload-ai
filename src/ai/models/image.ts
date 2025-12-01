import type { GenerationConfig } from '../../types.js'

import { getImageModel } from '../providers/index.js'
import { generateFileNameByPrompt } from '../utils/generateFileNameByPrompt.js'

export const ImageConfig: GenerationConfig = {
  models: [
    {
      id: 'image',
      name: 'Image Generation',
      fields: ['upload'],
      handler: async (prompt: string, options: any) => {
        const { req } = options

        if (!prompt || !prompt.trim()) {
          throw new Error(
            'Prompt is required for image generation. Please ensure your Instruction has a prompt template.',
          )
        }

        // Determine generation method by checking the model metadata
        // We need to fetch the provider's model configuration to check generationMethod
        const { getProviderRegistry } = await import('../providers/index.js')
        const registry = await getProviderRegistry(req.payload)
        const provider = registry[options.provider]

        let generationMethod: 'multimodal-text' | 'standard' = 'standard'

        if (provider && provider.models) {
          const modelConfig = provider.models.find((m: any) => m.id === options.model)
          console.log('generationMethod: modelConfig', modelConfig)
          if (modelConfig && modelConfig.generationMethod) {
            generationMethod = modelConfig.generationMethod
          }
        }
        console.log('generationMethod: L', generationMethod)

        // Get the model instance
        const model = await getImageModel(
          req.payload,
          options.provider,
          options.model,
          generationMethod,
        )

        // Route based on generation method
        if (generationMethod === 'multimodal-text') {
          // Use generateText for Nano Banana models
          const { generateText } = await import('ai')

          const result = await generateText({
            model, //: google('gemini-2.5-flash-image-preview'),
            prompt,
            providerOptions: {
              google: {
                imageConfig: {
                  aspectRatio: '16:9',
                },
                responseModalities: ['IMAGE', 'TEXT'],
              },
            },
          })

          // Extract images from result.files
          const images = result.files?.filter((f: any) => f.mediaType?.startsWith('image/')) || []

          console.log('generationMethod: images --> ', images?.length)

          if (images.length === 0) {
            throw new Error(
              'No images returned from the model. The model may have generated only text.',
            )
          }

          // Convert Uint8Array to base64
          const firstImage = images[0]
          console.log('firstImage --- ', Object.keys(firstImage))
          // @ts-ignore
          const base64 = firstImage.base64Data
          const mediaType = firstImage.mediaType
          console.log('mediaType: mediaType', mediaType)
          const buffer = Buffer.from(base64 ?? '', 'base64')

          return {
            data: {
              alt: prompt,
            },
            file: {
              name: `image_${generateFileNameByPrompt(prompt)}.png`, // TODO: fix extension based on mediaType
              data: buffer,
              mimetype: mediaType,
              size: buffer.byteLength,
            },
          }
        } else {
          // Use experimental_generateImage for standard models (Imagen, DALL-E, etc.)
          const { experimental_generateImage } = await import('ai')

          const { image } = await experimental_generateImage({
            model,
            n: 1,
            prompt,
          })
          // TODO: Return file
          return image.base64
        }
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
      } as any,
    },
  ],
  provider: 'Multi-Provider',
}
