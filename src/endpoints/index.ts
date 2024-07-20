import Handlebars from 'handlebars'
import type { PayloadRequest } from 'payload'

import { GenerationModels } from '../ai/models/index.js'
import type { Endpoints, Instructions } from '../types.js'

const replacePlaceholders = (prompt: string, values: object) => {
  return Handlebars.compile(prompt)(values)
}

export const endpoints: Endpoints = {
  textarea: {
    handler: async (req: PayloadRequest) => {
      const data = await req.json?.()

      const { locale = 'en', options } = data
      const { instructionId } = options
      const contextData = data.doc

      let instructions = { 'model-id': '', prompt: '' }

      if (instructionId) {
        instructions = (await req.payload.findByID({
          id: instructionId,
          collection: 'instructions',
        })) as Instructions
      }

      console.log('Instructions', instructions)
      console.log('data.doc', contextData)

      const { prompt: promptTemplate = '' } = instructions

      const text = replacePlaceholders(promptTemplate, contextData)

      console.log('prompt text:', text)
      const { defaultLocale, locales = [] } = req.payload.config.localization || {}
      const localeData = locales.find((l) => {
        return l.code === locale
      })

      const localeInfo = localeData?.label[defaultLocale] || locale

      //TODO: remove this
      const opt = {
        locale: localeInfo,
        modelId: instructions['model-id'],
      }

      const model = GenerationModels.find((model) => model.id === opt.modelId)
      const settingsName = model.settings?.name
      const modelOptions = instructions[settingsName] || {}

      const result = await model.handler?.(text, { ...modelOptions, ...opt })

      return new Response(JSON.stringify({ result }))
    },
    method: 'post',
    path: '/ai/generate/textarea',
  },
  upload: {
    handler: async (req: PayloadRequest) => {
      const data = await req.json?.()

      const { options } = data
      const { instructionId, uploadCollectionSlug } = options
      const contextData = data.doc

      let instructions = { 'model-id': '', prompt: '' }

      if (instructionId) {
        instructions = (await req.payload.findByID({
          id: instructionId,
          collection: 'instructions',
        })) as Instructions
      }

      console.log('Instructions', instructions)
      console.log('data.doc', contextData)

      const { prompt: promptTemplate = '' } = instructions

      const text = replacePlaceholders(promptTemplate, contextData)
      const modelId = instructions['model-id']
      console.log('prompt text:', text)

      const model = GenerationModels.find((model) => model.id === modelId)
      const settingsName = model.settings?.name
      const modelOptions = instructions[settingsName] || {}
      console.log('modelOptions', modelOptions)

      const result = await model.handler?.(text, modelOptions)

      const assetData = await req.payload.create({
        collection: uploadCollectionSlug,
        data: result.data,
        file: result.file,
      })

      console.log('assetData', assetData)

      return new Response(
        JSON.stringify({
          result: {
            id: assetData.id,
            alt: assetData.alt,
          },
        }),
      )
    },
    method: 'post',
    path: '/ai/generate/upload',
  },
}
