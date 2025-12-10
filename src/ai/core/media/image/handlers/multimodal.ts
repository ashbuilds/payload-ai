import { generateText, type LanguageModel, ModelMessage } from 'ai'

import type { ImageGenerationArgs, MediaResult, MultimodalImageFile } from '../../types.js'

import { convertToBuffer, getExtensionFromMimeType } from '../../utils.js'

/**
 * Handle multimodal text-to-image generation (e.g., Gemini Nano Banana)
 * Uses generateText with image response modalities
 */
export async function generateMultimodalImage(
  model: LanguageModel,
  args: ImageGenerationArgs,
): Promise<MediaResult> {
  const { images = [], prompt, providerOptions = {} } = args
  //
  // const promptParts: ModelMessage[] = [
  //   { role: 'user', content: [{ type: 'text', text: prompt } }],
  //   ...,
  // ]
  //
  // const messages = [
  //   {
  //     content: promptParts,
  //     role: 'user' as const,
  //   },
  // ]

  const result = await generateText({
    model,
    // onStepFinish: (step) => {
    //   console.log('step finish: ', step.files)
    //   console.log('step finish: ', step.response)
    // },
    messages: [
      {
        content: [{ type: 'text', text: prompt }, ...images],
        role: 'user',
      },
    ],
    providerOptions: {
      google: {
        imageConfig: {
          aspectRatio: args.aspectRatio || '16:9',
        },
        responseModalities: ['IMAGE', 'TEXT'],
      },
      // ...providerOptions,//TODO: ENDABLE THIS, BUT Properly merge it with defaults otherwise image will not eb generated
    },
  })

  console.log("model -->", model)
  console.log('result... ', result)

  // Extract images from result.files
  const resultImages = (result.files?.filter((f: MultimodalImageFile) =>
    f.mediaType?.startsWith('image/'),
  ) || []) as MultimodalImageFile[]

  if (resultImages.length === 0) {
    throw new Error('No images returned from the model. The model may have generated only text.')
  }

  const firstImage = resultImages[0]
  const mimeType = firstImage.mediaType || 'image/png'
  const imageData = firstImage.base64Data || firstImage.uint8Array

  if (!imageData) {
    throw new Error('Image data is missing from the response.')
  }

  const buffer = convertToBuffer(imageData)
  const extension = getExtensionFromMimeType(mimeType)

  return {
    file: {
      name: `generated.${extension}`,
      data: buffer,
      mimetype: mimeType,
      size: buffer.byteLength,
    },
  }
}
