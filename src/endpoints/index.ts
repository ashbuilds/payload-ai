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
import { extractImageData } from '../utilities/extractImageData.js'
import { getGenerationModels } from '../utilities/getGenerationModels.js'

const requireAuthentication = (req: PayloadRequest) => {
  if (!req.user) {
    throw new Error('Authentication required. Please log in to use AI features.')
  }
  return true
}

const checkAccess = async (req: PayloadRequest, pluginConfig: PluginConfig) => {
  requireAuthentication(req)

  if (pluginConfig.access?.generate) {
    const hasAccess = await pluginConfig.access.generate({ req })
    if (!hasAccess) {
      throw new Error('Insufficient permissions to use AI generation features.')
    }
  }

  return true
}

const assignPrompt = async (
  action: ActionMenuItems,
  {
    type,
    actionParams,
    context,
    field,
    layout,
    locale,
    pluginConfig,
    systemPrompt = '',
    template,
  }: {
    actionParams: Record<any, any>
    context: object
    field: string
    layout: string
    locale: string
    pluginConfig: PluginConfig,
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
    if (locale && locale !== 'en') {
      /**
       * NOTE: Avoid using the "system prompt" for setting the output language,
       * as it causes quotation marks to appear in the output (Currently only tested with openai models).
       * Appending the language instruction directly to the prompt resolves this issue.
       **/
      assignedPrompts.prompt += `
    ---  
    OUTPUT LANGUAGE: ${locale}
    `
    }

    return assignedPrompts
  }

  const prompts = [...pluginConfig.prompts || [], ...defaultPrompts]
  const foundPrompt = prompts.find((p) => p.name === action)
  const getLayout = foundPrompt?.layout
  const getSystemPrompt = foundPrompt?.system

  let updatedLayout = layout
  if (getLayout) {
    updatedLayout = getLayout()
  }

  const system = getSystemPrompt
    ? getSystemPrompt({
        ...(actionParams || {}),
        prompt,
        systemPrompt,
      })
    : ''

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
        try {
          // Check authentication and authorization first
          await checkAccess(req, pluginConfig)

          const data = await req.json?.()

          const { allowedEditorNodes = [], locale = 'en', options } = data
          const { action, actionParams, instructionId } = options
          const contextData = data.doc

          if (!instructionId) {
            throw new Error(
              `Instruction ID is required for "${PLUGIN_NAME}" to work, please check your configuration`,
            )
          }

          // Verify user has access to the specific instruction
          const instructions = await req.payload.findByID({
            id: instructionId,
            collection: PLUGIN_INSTRUCTIONS_TABLE,
            req, // Pass req to ensure access control is applied
          })

          const { collections } = req.payload.config
          const collection = collections.find(
            (collection) => collection.slug === PLUGIN_INSTRUCTIONS_TABLE,
          )

          if (!collection) {
            throw new Error('Collection not found')
          }

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

          let localeInfo = locale
          if (
            localeData &&
            defaultLocale &&
            localeData.label &&
            typeof localeData.label === 'object' &&
            defaultLocale in localeData.label
          ) {
            localeInfo = localeData.label[defaultLocale]
          }

          const models = getGenerationModels(pluginConfig)
          const model =
            models && Array.isArray(models)
              ? models.find((model) => model.id === instructions['model-id'])
              : undefined

          if (!model) {
            throw new Error('Model not found')
          }

          // @ts-ignore
          const settingsName = model && model.settings ? model.settings.name : undefined
          if (!settingsName) {
            req.payload.logger.error('— AI Plugin: Error fetching settings name!')
          }

          const modelOptions = settingsName ? instructions[settingsName] || {} : {}

          const prompts = await assignPrompt(action, {
            type: String(instructions['field-type']),
            actionParams,
            context: contextData,
            field: fieldName || '',
            layout: instructions.layout,
            locale: localeInfo,
            pluginConfig,
            systemPrompt: instructions.system,
            template: String(promptTemplate),
          })

          return model.handler?.(prompts.prompt, {
            ...modelOptions,
            editorSchema: allowedEditorSchema,
            layout: prompts.layout,
            locale: localeInfo,
            system: prompts.system,
          })
        } catch (error) {
          req.payload.logger.error(error, 'Error generating content: ')
          const message =
            error && typeof error === 'object' && 'message' in error
              ? (error as any).message
              : String(error)
          return new Response(JSON.stringify({ error: message }), {
            headers: { 'Content-Type': 'application/json' },
            status:
              message.includes('Authentication required') ||
              message.includes('Insufficient permissions')
                ? 401
                : 500,
          })
        }
      },
      method: 'post',
      path: PLUGIN_API_ENDPOINT_GENERATE,
    },
    upload: {
      handler: async (req: PayloadRequest) => {
        try {
          // Check authentication and authorization first
          await checkAccess(req, pluginConfig)

          const data = await req.json?.()

          const { collectionSlug, documentId, options } = data
          const { instructionId } = options
          let docData = {}

          if (documentId) {
            try {
              docData = await req.payload.findByID({
                id: documentId,
                collection: collectionSlug,
                draft: true,
                req, // Pass req to ensure access control is applied
              })
            } catch (e) {
              req.payload.logger.error(e,
                '— AI Plugin: Error fetching document, you should try again after enabling drafts for this collection',
              )
            }
          }

          const contextData = {
            ...data.doc,
            ...docData,
          }

          let instructions: Record<string, any> = { images: [], 'model-id': '', prompt: '' }

          if (instructionId) {
            // Verify user has access to the specific instruction
            instructions = await req.payload.findByID({
              id: instructionId,
              collection: PLUGIN_INSTRUCTIONS_TABLE,
              req, // Pass req to ensure access control is applied
            })
          }

          const { images: sampleImages = [], prompt: promptTemplate = '' } = instructions
          const schemaPath = instructions['schema-path']

          registerEditorHelper(req.payload, schemaPath)

          const text = await replacePlaceholders(promptTemplate, contextData)
          const modelId = instructions['model-id']
          const uploadCollectionSlug = instructions['relation-to']

          const images = [...extractImageData(text), ...sampleImages]

          const editImages = []
          for (const img of images) {
            try {
              const serverURL =
                req.payload.config?.serverURL ||
                process.env.SERVER_URL ||
                process.env.NEXT_PUBLIC_SERVER_URL

              const response = await fetch(`${serverURL}${img.image.url}`, {
                headers: {
                  //TODO: Further testing needed or so find a proper way.
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
              req.payload.logger.error(e, 'Error fetching reference images!')
              throw Error(
                "We couldn't fetch the images. Please ensure the images are accessible and hosted publicly.",
              )
            }
          }

          const modelsUpload = getGenerationModels(pluginConfig)
          const model =
            modelsUpload && Array.isArray(modelsUpload)
              ? modelsUpload.find((model) => model.id === modelId)
              : undefined

          if (!model) {
            throw new Error('Model not found')
          }

          // @ts-ignore
          const settingsName = model && model.settings ? model.settings.name : undefined
          if (!settingsName) {
            req.payload.logger.error('— AI Plugin: Error fetching settings name!')
          }

          let modelOptions = settingsName ? instructions[settingsName] || {} : {}
          modelOptions = {
            ...modelOptions,
            images: editImages,
          }

          const result = await model.handler?.(text, modelOptions)
          let assetData: { alt?: string; id: number | string }

          if (typeof pluginConfig.mediaUpload === 'function') {
            assetData = await pluginConfig.mediaUpload(result, {
              collection: uploadCollectionSlug,
              request: req,
            })
          } else {
            assetData = await req.payload.create({
              collection: uploadCollectionSlug,
              data: result.data,
              file: result.file,
              req, // Pass req to ensure access control is applied
            })
          }

          if (!assetData.id) {
            req.payload.logger.error(
              'Error uploading generated media, is your media upload function correct?',
            )
            throw new Error('Error uploading generated media!')
          }

          return new Response(
            JSON.stringify({
              result: {
                id: assetData.id,
                alt: assetData.alt,
              },
            }),
          )
        } catch (error) {
          req.payload.logger.error(error, 'Error generating upload: ')
          const message =
            error && typeof error === 'object' && 'message' in error
              ? (error as any).message
              : String(error)
          return new Response(JSON.stringify({ error: message }), {
            headers: { 'Content-Type': 'application/json' },
            status:
              message.includes('Authentication required') ||
              message.includes('Insufficient permissions')
                ? 401
                : 500,
          })
        }
      },
      method: 'post',
      path: PLUGIN_API_ENDPOINT_GENERATE_UPLOAD,
    },
  }) satisfies Endpoints
