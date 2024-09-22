import type { PayloadRequest } from 'payload'

import type { Endpoints } from '../types.js'

import { GenerationModels } from '../ai/models/index.js'
import {
  PLUGIN_API_ENDPOINT_GENERATE,
  PLUGIN_API_ENDPOINT_GENERATE_UPLOAD,
  PLUGIN_INSTRUCTIONS_TABLE,
  PLUGIN_NAME,
} from '../defaults.js'
import { registerEditorHelper } from '../libraries/handlebars/helpers.js'
import { replacePlaceholders } from '../libraries/handlebars/replacePlaceholders.js'
import { textareaHandler } from './textareaHandler.js'

export const endpoints: Endpoints = {
  textarea: {
    handler: async (req: PayloadRequest) => {
      const data = await req.json?.()

      const { options } = data
      const { instructionId } = options

      if (!instructionId) {
        throw new Error(
          `Instruction ID is required for "${PLUGIN_NAME}" to work, please check your configuration`,
        )
      }

      const instructions = await req.payload.findByID({
        id: instructionId,
        collection: PLUGIN_INSTRUCTIONS_TABLE,
      })

      return textareaHandler({
        doc: data.doc,
        instructions,
        options: data.options,
        payload: req.payload,
      })
    },
    method: 'post',
    path: PLUGIN_API_ENDPOINT_GENERATE,
  },
  upload: {
    handler: async (req: PayloadRequest) => {
      const data = await req.json?.()

      const { options } = data
      const { instructionId } = options
      const contextData = data.doc

      let instructions = { 'model-id': '', prompt: '' }

      if (instructionId) {
        // @ts-expect-error
        instructions = await req.payload.findByID({
          id: instructionId,
          collection: PLUGIN_INSTRUCTIONS_TABLE,
        })
      }

      const { prompt: promptTemplate = '' } = instructions
      const schemaPath = instructions['schema-path']

      registerEditorHelper(req.payload, schemaPath)

      const text = await replacePlaceholders(promptTemplate, contextData)
      const modelId = instructions['model-id']
      const uploadCollectionSlug = instructions['relation-to']

      const model = GenerationModels.find((model) => model.id === modelId)
      const settingsName = model.settings?.name
      const modelOptions = instructions[settingsName] || {}

      const result = await model.handler?.(text, modelOptions)

      const assetData = await req.payload.create({
        collection: uploadCollectionSlug,
        data: result.data,
        file: result.file,
      })

      return Response.json({
        result: {
          id: assetData.id,
          alt: assetData.alt,
        },
      })
    },
    method: 'post',
    path: PLUGIN_API_ENDPOINT_GENERATE_UPLOAD,
  },
}
