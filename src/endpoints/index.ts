import type { CollectionSlug, PayloadRequest } from 'payload'

import * as process from 'node:process'

import type {
  ActionMenuItems,
  Endpoints,
  PluginConfig,
  PromptFieldGetterContext,
} from '../types.js'

import { defaultPrompts } from '../ai/prompts.js'
import { filterEditorSchemaByNodes } from '../ai/utils/filterEditorSchemaByNodes.js'
import {
  PLUGIN_AI_JOBS_TABLE,
  PLUGIN_API_ENDPOINT_GENERATE,
  PLUGIN_API_ENDPOINT_GENERATE_UPLOAD,
  PLUGIN_API_ENDPOINT_VIDEOGEN_WEBHOOK,
  PLUGIN_INSTRUCTIONS_TABLE,
  PLUGIN_NAME,
} from '../defaults.js'
import { asyncHandlebars } from '../libraries/handlebars/asyncHandlebars.js'
import { registerEditorHelper } from '../libraries/handlebars/helpers.js'
import { handlebarsHelpersMap } from '../libraries/handlebars/helpersMap.js'
import { replacePlaceholders } from '../libraries/handlebars/replacePlaceholders.js'
import { extractImageData } from '../utilities/extractImageData.js'
import { fieldToJsonSchema } from '../utilities/fieldToJsonSchema.js'
import { getFieldBySchemaPath } from '../utilities/getFieldBySchemaPath.js'
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

const extendContextWithPromptFields = (
  data: object,
  ctx: PromptFieldGetterContext,
  pluginConfig: PluginConfig,
) => {
  const { promptFields = [] } = pluginConfig
  const fieldsMap = new Map(
    promptFields
      .filter((f) => !f.collections || f.collections.includes(ctx.collection))
      .map((f) => [f.name, f]),
  )
  return new Proxy(data, {
    get: (target, prop: string) => {
      const field = fieldsMap.get(prop)
      if (field?.getter) {
        const value = field.getter(data, ctx)
        return Promise.resolve(value).then((v) => new asyncHandlebars.SafeString(v))
      }
      // {{prop}} escapes content by default. Here we make sure it won't be escaped.
      const value = typeof target === 'object' ? (target as any)[prop] : undefined
      return typeof value === 'string' ? new asyncHandlebars.SafeString(value) : value
    },
    // It's used by the handlebars library to determine if the property is enumerable
    getOwnPropertyDescriptor: (target, prop) => {
      const field = fieldsMap.get(prop as string)
      if (field) {
        return {
          configurable: true,
          enumerable: true,
        }
      }
      return Object.getOwnPropertyDescriptor(target, prop)
    },
    has: (target, prop) => {
      return fieldsMap.has(prop as string) || (target && prop in target)
    },
    ownKeys: (target) => {
      return [...fieldsMap.keys(), ...Object.keys(target || {})]
    },
  })
}

const buildRichTextSystem = (baseSystem: string, layout: string) => {
  return `${baseSystem}

RULES:
- Generate original and unique content based on the given topic.
- Strictly adhere to the specified layout and formatting instructions.
- Utilize the provided rich text editor tools for appropriate formatting.
- Ensure the output follows the structure of the sample output object.
- Produce valid JSON with no undefined or null values.
---
LAYOUT INSTRUCTIONS:
${layout}

---
ADDITIONAL GUIDELINES:
- Ensure coherence and logical flow between all sections.
- Maintain a consistent tone and style throughout the content.
- Use clear and concise language appropriate for the target audience.
`;
};

const assignPrompt = async (
  action: ActionMenuItems,
  {
    type,
    actionParams,
    collection,
    context,
    field,
    layout,
    locale,
    pluginConfig,
    systemPrompt = '',
    template,
  }: {
    actionParams: Record<any, any>
    collection: CollectionSlug
    context: object
    field: string
    layout: string
    locale: string
    pluginConfig: PluginConfig
    systemPrompt: string
    template: string
    type: string
  },
) => {
  const extendedContext = extendContextWithPromptFields(context, { type, collection }, pluginConfig)
  const prompt = await replacePlaceholders(template, extendedContext)
  const toLexicalHTML = type === 'richText' ? handlebarsHelpersMap.toHTML.name : ''

  const assignedPrompts = {
    layout: type === 'richText' ? layout : undefined,
    prompt,
    //TODO: Define only once on a collection level
    system: type === 'richText' ? buildRichTextSystem(systemPrompt, layout) : undefined,
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

  const prompts = [...(pluginConfig.prompts || []), ...defaultPrompts]
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
    prompt: await replacePlaceholders(`{{${toLexicalHTML} ${field}}}`, extendedContext),
    system: type === 'richText' ? buildRichTextSystem(system, updatedLayout) : system,
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
              `Instruction ID is required for "${PLUGIN_NAME}" to work, please check your configuration, or try again`,
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

          const schemaPath = String(instructions['schema-path'])
          const parts = (schemaPath || '').split('.') || []
          const collectionName = parts[0]
          const fieldName = parts.length > 1 ? parts[parts.length - 1] : ''

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

          const settingsName = model.settings && "name" in model.settings ? model.settings.name : undefined
          if (!settingsName) {
            req.payload.logger.error('— AI Plugin: Error fetching settings name!')
          }

          const modelOptions = settingsName ? instructions[settingsName] || {} : {}

          const prompts = await assignPrompt(action, {
            type: String(instructions['field-type']),
            actionParams,
            collection: collectionName,
            context: contextData,
            field: fieldName || '',
            layout: instructions.layout,
            locale: localeInfo,
            pluginConfig,
            systemPrompt: instructions.system,
            template: String(promptTemplate),
          })

          if (pluginConfig.debugging) {
            req.payload.logger.info(
              { prompts },
              `— AI Plugin: Executing text prompt on ${schemaPath} using ${model.id}`,
            )
          }

          // Build per-field JSON schema for structured generation when applicable
          let jsonSchema= allowedEditorSchema
          try {
            const targetCollection = req.payload.config.collections.find(
              (c) => c.slug === collectionName,
            )
            if (targetCollection && fieldName) {
              const targetField = getFieldBySchemaPath(targetCollection, schemaPath)
              const supported = ['text', 'textarea', 'select', 'number', 'date', 'code', 'email', 'json']
              const t = String(targetField?.type || '')
              if (targetField && supported.includes(t)) {
                jsonSchema = fieldToJsonSchema(targetField as any, { nameOverride: fieldName })
              }
            }
          } catch (e) {
            req.payload.logger.error(e, '— AI Plugin: Error building field JSON schema')
          }

          return model.handler?.(prompts.prompt, {
            ...modelOptions,
            layout: prompts.layout,
            locale: localeInfo,
            schema: jsonSchema,
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
              req.payload.logger.error(
                e,
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
          console.log('sampleImages --- >', sampleImages)
          registerEditorHelper(req.payload, schemaPath)

          const extendedContext = extendContextWithPromptFields(
            contextData,
            { type: instructions['field-type'], collection: collectionSlug },
            pluginConfig,
          )
          const text = await replacePlaceholders(promptTemplate, extendedContext)
          const modelId = instructions['model-id']
          const uploadCollectionSlug = instructions['relation-to']

          const images = [...extractImageData(text), ...sampleImages]
          console.log('images :  ', images)

          const editImages = []
          for (const img of images) {
            const serverURL =
              req.payload.config?.serverURL ||
              process.env.SERVER_URL ||
              process.env.NEXT_PUBLIC_SERVER_URL

            let url = img.image.thumbnailURL || img.image.url
            if (!url.startsWith('http')) {
              url = `${serverURL}${url}`
            }

            try {
              const response = await fetch(url, {
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
                url,
              })
            } catch (e) {
              req.payload.logger.error(e, `Error fetching reference image ${url}`)
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

          if (pluginConfig.debugging) {
            req.payload.logger.info(
              { text },
              `— AI Plugin: Executing image prompt using ${model.id}`,
            )
          }

          // Prepare callback URL for async jobs
          const serverURL =
            req.payload.config?.serverURL ||
            process.env.SERVER_URL ||
            process.env.NEXT_PUBLIC_SERVER_URL

          const callbackUrl = serverURL
            ? `${serverURL.replace(/\/$/, '')}/api${PLUGIN_API_ENDPOINT_VIDEOGEN_WEBHOOK}?instructionId=${instructionId}`
            : undefined

          const result = await model.handler?.(text, {
            ...modelOptions,
            callbackUrl,
            instructionId,
          })

          // If model returned a file immediately, proceed with upload
          if (result && 'file' in result) {
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
          }

          // Otherwise, assume async job launch
          if (result && ('jobId' in result || 'taskId' in result)) {
            const externalTaskId = (result as any).jobId || (result as any).taskId
            const status = (result as any).status || 'queued'
            const progress = (result as any).progress ?? 0

            // Create AI Job doc and return only its id
            const createdJob = await req.payload.create({
              collection: PLUGIN_AI_JOBS_TABLE,
              data: {
                instructionId,
                progress,
                status,
                task_id: externalTaskId,
              },
              overrideAccess: true,
              req,
            })

            return new Response(JSON.stringify({ job: { id: createdJob.id } }), {
              headers: { 'Content-Type': 'application/json' },
            })
          }

          throw new Error('Unexpected model response.')
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
    videogenWebhook: {
      handler: async (req: PayloadRequest) => {
        console.log("videogenWebhook --> ")
        try {
          const urlAll = new URL(req.url || '')
          const qpSecret = urlAll.searchParams.get('secret') || ''
          const headerSecret = req.headers.get('x-webhook-secret') || ''
          const falSecret = process.env.FAL_WEBHOOK_SECRET
          const legacySecret = process.env.VIDEOGEN_WEBHOOK_SECRET
          const provided = qpSecret || headerSecret
          if (!provided || (falSecret ? provided !== falSecret : provided !== legacySecret)) {
            return new Response('Unauthorized', { status: 401 })
          }

          const instructionId = urlAll.searchParams.get('instructionId')
          if (!instructionId) {
            throw new Error('instructionId missing')
          }

          const body = await req.json?.()
          // Normalize fal webhook payload
          const status: string | undefined =
            (body && (body.status || body.data?.status || body.response?.status)) || undefined
          const progress: number | undefined =
            (body && (body.progress ?? body.data?.progress ?? body.response?.progress)) ?? undefined
          const requestId: string | undefined =
            (body && (body.taskId || body.request_id || body.gateway_request_id || body.request?.request_id)) || undefined
          const error = body?.error || body?.data?.error || body?.response?.error

          // Update AI Job row by task_id (and instructionId)
          const jobSearch = await req.payload.find({
            collection: PLUGIN_AI_JOBS_TABLE,
            where: {
              and: [
                { task_id: { equals: requestId } },
                { instructionId: { equals: instructionId } },
              ],
            },
            limit: 1,
            depth: 0,
          })

          const jobDoc = jobSearch.docs?.[0]
          if (jobDoc) {
            await req.payload.update({
              id: jobDoc.id,
              collection: PLUGIN_AI_JOBS_TABLE,
              data: {
                progress,
                status,
                task_id: requestId,
              },
              overrideAccess: true,
              req,
            })
          }

          console.log('fal webhook body: ', body)

          const videoUrl =
            body?.outputs?.[0]?.url ||
            body?.data?.outputs?.[0]?.url ||
            body?.video?.url ||
            body?.data?.video?.url ||
            body?.response?.video?.url ||
            body?.videos?.[0]?.url ||
            body?.data?.videos?.[0]?.url

          if (status === 'completed' && videoUrl) {
            // Fetch the related instruction to get upload collection
            const instructions = await req.payload.findByID({
              id: instructionId,
              collection: PLUGIN_INSTRUCTIONS_TABLE,
              req,
            })

            const uploadCollectionSlug = instructions['relation-to']

            const videoResp = await fetch(videoUrl)
            if (!videoResp.ok) {
              throw new Error(`Failed to fetch output: ${videoResp.status}`)
            }
            const buffer = Buffer.from(await videoResp.arrayBuffer())

            const created = await req.payload.create({
              collection: uploadCollectionSlug,
              data: { alt: 'video generation' },
              file: {
                name: 'video_generation.mp4',
                data: buffer,
                mimetype: 'video/mp4',
                size: buffer.byteLength,
              },
              overrideAccess: true,
              req,
            })

            // Persist the result on the AI Job record
            if (jobDoc) {
              await req.payload.update({
                id: jobDoc.id,
                collection: PLUGIN_AI_JOBS_TABLE,
                data: {
                  progress: 100,
                  result_id: created?.id,
                  status: 'completed',
                },
                overrideAccess: true,
                req,
              })
            }
          }

          if (status === 'failed' && error) {
            req.payload.logger.error(error, 'Video generation failed: ')
          }

          return new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          req.payload.logger.error(error, 'Error in videogen webhook: ')
          const message =
            error && typeof error === 'object' && 'message' in error
              ? (error as any).message
              : String(error)
          return new Response(JSON.stringify({ error: message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
          })
        }
      },
      method: 'post',
      path: PLUGIN_API_ENDPOINT_VIDEOGEN_WEBHOOK,
    },
  }) satisfies Endpoints
