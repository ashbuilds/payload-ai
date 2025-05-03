import type { PayloadRequest } from 'payload'

import * as process from 'node:process'

import type { ActionMenuItems, Endpoints, PluginConfig } from '../types.js'

import { defaultPrompts } from '../ai/prompts.js'
import { filterEditorSchemaByNodes } from '../ai/utils/filterEditorSchemaByNodes.js'
import {
  PLUGIN_API_ENDPOINT_GENERATE,
  PLUGIN_API_ENDPOINT_GENERATE_UPLOAD,
  PLUGIN_INSTRUCTIONS_TABLE,
  PLUGIN_NAME,
} from '../defaults.js'
import { registerEditorHelper } from '../libraries/handlebars/helpers.js'
import { handlebarsHelpersMap } from '../libraries/handlebars/helpersMap.js'
import { replacePlaceholders } from '../libraries/handlebars/replacePlaceholders.js'
import { getGenerationModels } from '../utilities/getGenerationModels.js'

const assignPrompt = async (
  action: ActionMenuItems,
  {
    type,
    actionParams,
    context,
    field,
    layout,
    systemPrompt = '',
    template,
  }: {
    actionParams: Record<any, any>
    context: object
    field: string
    layout: string
    systemPrompt: string
    template: string
    type: string
  },
) => {
  const prompt = await replacePlaceholders(template, context)
  const toLexicalHTML = type === 'richText' ? handlebarsHelpersMap.toHTML.name : ''

  const assignedPrompts = {
    layout: type === 'richText' ? layout : undefined,
    prompt,
    //TODO: Define only once on a collection level
    system: type === 'richText' ? systemPrompt : undefined,
  }

  if (action === 'Compose') {
    return assignedPrompts
  }

  const { layout: getLayout, system: getSystemPrompt } = defaultPrompts.find(
    (p) => p.name === action,
  )

  let updatedLayout = layout
  if (getLayout) {
    updatedLayout = getLayout()
  }

  const system = getSystemPrompt({
    ...(actionParams || {}),
    prompt,
    systemPrompt,
  })

  return {
    layout: updatedLayout,
    // TODO: revisit this toLexicalHTML
    prompt: await replacePlaceholders(`{{${toLexicalHTML} ${field}}}`, context),
    system,
  }
}

export const endpoints: (pluginConfig: PluginConfig) => Endpoints = (pluginConfig) =>
  ({
    textarea: {
      //TODO:  This is the main endpoint for generating content - its just needs to be renamed to 'generate' or something.
      handler: async (req: PayloadRequest) => {
        const data = await req.json?.()

        const { allowedEditorNodes = [], locale = 'en', options } = data
        const { action, actionParams, instructionId } = options
        const contextData = data.doc

        if (!instructionId) {
          throw new Error(
            `Instruction ID is required for "${PLUGIN_NAME}" to work, please check your configuration`,
          )
        }

        const instructions = await req.payload.findByID({
          id: instructionId,
          collection: PLUGIN_INSTRUCTIONS_TABLE,
        })

        const { collections } = req.payload.config
        const collection = collections.find(
          (collection) => collection.slug === PLUGIN_INSTRUCTIONS_TABLE,
        )

        const { custom: { [PLUGIN_NAME]: { editorConfig = {} } = {} } = {} } = collection.admin
        const { schema: editorSchema = {} } = editorConfig
        const { prompt: promptTemplate = '' } = instructions

        let allowedEditorSchema = editorSchema
        if (allowedEditorNodes.length) {
          allowedEditorSchema = filterEditorSchemaByNodes(editorSchema, allowedEditorNodes)
        }

        const schemaPath = instructions['schema-path'] as string
        const fieldName = schemaPath?.split('.').pop()

        registerEditorHelper(req.payload, schemaPath)

        const { defaultLocale, locales = [] } = req.payload.config.localization || {}
        const localeData = locales.find((l) => {
          return l.code === locale
        })

        const localeInfo = localeData?.label[defaultLocale] || locale

        const model = getGenerationModels(pluginConfig).find(
          (model) => model.id === instructions['model-id'],
        )
        const settingsName = model.settings?.name
        const modelOptions = instructions[settingsName] || {}

        const prompts = await assignPrompt(action, {
          type: instructions['field-type'] as string,
          actionParams,
          context: contextData,
          field: fieldName,
          layout: instructions.layout,
          systemPrompt: instructions.system,
          template: promptTemplate as string,
        })

        try {
          return model.handler?.(prompts.prompt, {
            ...modelOptions,
            editorSchema: allowedEditorSchema,
            layout: prompts.layout,
            locale: localeInfo,
            system: prompts.system,
          })
        } catch (error) {
          req.payload.logger.error('Error generating content: ', error)
          return new Response(JSON.stringify(error.message), { status: 500 })
        }
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

        let instructions = { images: [], 'model-id': '', prompt: '' }

        if (instructionId) {
          // @ts-expect-error
          instructions = await req.payload.findByID({
            id: instructionId,
            collection: PLUGIN_INSTRUCTIONS_TABLE,
          })
        }

        const { images = [], prompt: promptTemplate = '' } = instructions
        const editImages = []
        for (const img of images) {
          try {
            const serverURL =
              req.payload.config?.serverURL ||
              process.env.SERVER_URL ||
              process.env.NEXT_PUBLIC_SERVER_URL

            const response = await fetch(`${serverURL}${img.image.url}`, {
              headers: {
                //TODO: Further testing needed
                Authorization: `Bearer ${req.headers.get('Authorization')?.split('Bearer ')[1] || ''}`,
              },
              method: 'GET',
            })

            const blob = await response.blob()
            editImages.push({
              name: img.image.name,
              type: img.image.type,
              data: blob,
              size: blob.size,
              url: `${serverURL}${img.image.url}`,
            })
          } catch (e) {
            req.payload.logger.error('Error fetching reference images:', e)
            throw Error(
              "We couldn't fetch the images. Please ensure the images are accessible and hosted publicly.",
            )
          }
        }

        const schemaPath = instructions['schema-path']

        registerEditorHelper(req.payload, schemaPath)

        const text = await replacePlaceholders(promptTemplate, contextData)
        const modelId = instructions['model-id']
        const uploadCollectionSlug = instructions['relation-to']

        const model = getGenerationModels(pluginConfig).find((model) => model.id === modelId)
        const settingsName = model.settings?.name
        let modelOptions = instructions[settingsName] || {}
        modelOptions = {
          ...modelOptions,
          images: editImages,
        }

        const result = await model.handler?.(text, modelOptions)

        const assetData = await req.payload.create({
          collection: uploadCollectionSlug,
          data: result.data,
          file: result.file,
        })

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
      path: PLUGIN_API_ENDPOINT_GENERATE_UPLOAD,
    },
  }) satisfies Endpoints
