import type { ImagePart } from 'ai'
import type { PayloadRequest } from 'payload'

import * as process from 'node:process'

import type { Endpoints, PluginConfig } from '../types.js'

import { checkAccess } from '../access/checkAccess.js'
import { filterEditorSchemaByNodes } from '../ai/utils/filterEditorSchemaByNodes.js'
import {
  PLUGIN_AI_JOBS_TABLE,
  PLUGIN_API_ENDPOINT_GENERATE,
  PLUGIN_API_ENDPOINT_GENERATE_UPLOAD,
  PLUGIN_API_ENDPOINT_VIDEOGEN_WEBHOOK,
  PLUGIN_INSTRUCTIONS_TABLE,
  PLUGIN_NAME,
} from '../defaults.js'
import { registerEditorHelper } from '../libraries/handlebars/helpers.js'
import { replacePlaceholders } from '../libraries/handlebars/replacePlaceholders.js'
import { extractImageData } from '../utilities/extractImageData.js'
import { type FetchableImage, fetchImages } from '../utilities/fetchImages.js'
import { fieldToJsonSchema } from '../utilities/fieldToJsonSchema.js'
import { getFieldBySchemaPath } from '../utilities/getFieldBySchemaPath.js'
import { resolveImageReferences } from '../utilities/resolveImageReferences.js'
import { assignPrompt, extendContextWithPromptFields } from './buildPromptUtils.js'

export const endpoints: (pluginConfig: PluginConfig) => Endpoints = (pluginConfig) =>
  ({
    textarea: {
      // Text/rich-text generation endpoint using payload.ai.streamObject
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
              `— AI Plugin: Executing text prompt on ${schemaPath}`,
            )
          }

          // Build per-field JSON schema for structured generation when applicable
          let jsonSchema = allowedEditorSchema
          try {
            const targetCollection = req.payload.config.collections.find(
              (c) => c.slug === collectionName,
            )
            if (targetCollection && fieldName) {
              const targetField = getFieldBySchemaPath(targetCollection, schemaPath)
              const supported = [
                'text',
                'textarea',
                'select',
                'number',
                'date',
                'code',
                'email',
                'json',
              ]
              const t = String(targetField?.type || '')
              if (targetField && supported.includes(t)) {
                jsonSchema = fieldToJsonSchema(targetField, { nameOverride: fieldName })
              }
            }
          } catch (e) {
            req.payload.logger.error(e, '— AI Plugin: Error building field JSON schema')
          }

          // Get model settings from instruction
          const settingsName =
            instructions['model-id'] === 'richtext'
              ? 'richtext-settings'
              : instructions['model-id'] === 'text'
                ? 'text-settings'
                : undefined

          if (!settingsName) {
            throw new Error(`Unsupported model-id: ${instructions['model-id']}`)
          }

          const modelSettings = instructions[settingsName] || {}

          // Resolve @field:filename references from the prompt
          const { images: resolvedImages, processedPrompt } = await resolveImageReferences(
            prompts.prompt,
            contextData,
            req,
          )

          console.log('resolvedImagesL  ', resolvedImages)

          // Extract hardcoded URLs from the processed prompt
          const hardcodedImages = extractImageData(processedPrompt)

          // Combine images
          const allImages = [...hardcodedImages, ...resolvedImages] as FetchableImage[]

          let images: ImagePart[] | undefined

          if (allImages.length > 0) {
            const imageParts = await fetchImages(req, allImages)

            if (imageParts.length > 0) {
              images = imageParts
            }
          }

          // Use payload.ai.streamObject directly! 🎉
          const streamResult = await req.payload.ai.streamObject({
            // extractAttachments: modelSettings.extractAttachments as boolean | undefined,
            images,
            maxTokens: modelSettings.maxTokens as number | undefined,
            model: modelSettings.model as string,
            prompt: processedPrompt,
            provider: modelSettings.provider as string,
            schema: jsonSchema,
            system: prompts.system,
            temperature: modelSettings.temperature as number | undefined,
          })

          return streamResult
        } catch (error) {
          req.payload.logger.error(error, 'Error generating content: ')
          const message =
            error && typeof error === 'object' && 'message' in error
              ? (error as Error).message
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
      // Image/video generation endpoint using payload.ai.generateMedia
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

          let instructions: Record<string, unknown> = { images: [], 'model-id': '', prompt: '' }

          if (instructionId) {
            // Verify user has access to the specific instruction
            instructions = await req.payload.findByID({
              id: instructionId,
              collection: PLUGIN_INSTRUCTIONS_TABLE,
              req, // Pass req to ensure access control is applied
            })
          }

          const { images: sampleImages = [], prompt: promptTemplate = '' } = instructions
          const schemaPath = String(instructions['schema-path'])
          registerEditorHelper(req.payload, schemaPath)

          const extendedContext = extendContextWithPromptFields(
            contextData,
            { type: String(instructions['field-type']), collection: collectionSlug },
            pluginConfig,
          )
          const text = await replacePlaceholders(promptTemplate as string, extendedContext)
          const modelId = instructions['model-id']
          const uploadCollectionSlug = instructions['relation-to']

          // Resolve @field:filename references from the prompt
          const { images: resolvedImages, processedPrompt } = await resolveImageReferences(
            text,
            contextData,
            req,
          )

          // Extract hardcoded URLs from the processed prompt and merge with resolved images and sample images
          const images = [
            ...extractImageData(processedPrompt),
            ...resolvedImages,
            ...(sampleImages as unknown[]),
          ] as FetchableImage[]

          // Process images - convert to ImagePart format using helper
          const editImages: ImagePart[] = await fetchImages(req, images)

          if (pluginConfig.debugging) {
            req.payload.logger.info({ text }, `— AI Plugin: Executing media generation`)
          }

          // Prepare callback URL for async jobs
          const serverURL =
            req.payload.config?.serverURL ||
            process.env.SERVER_URL ||
            process.env.NEXT_PUBLIC_SERVER_URL

          const callbackUrl = serverURL
            ? `${serverURL.replace(/\/$/, '')}/api${PLUGIN_API_ENDPOINT_VIDEOGEN_WEBHOOK}?instructionId=${instructionId}`
            : undefined

          // Get model settings
          const settingsName =
            modelId === 'image'
              ? 'image-settings'
              : modelId === 'video'
                ? 'video-settings'
                : modelId === 'tts'
                  ? 'tts-settings'
                  : undefined
          if (!settingsName) {
            throw new Error(`Unsupported model-id: ${modelId}`)
          }

          const modelSettings = instructions[settingsName] || {}

          // Use payload.ai.generateMedia directly! 🎉
          const result = await req.payload.ai.generateMedia({
            callbackUrl,
            images: editImages,
            instructionId,
            model: (modelSettings as Record<string, unknown>).model as string,
            prompt: text,
            provider: (modelSettings as Record<string, unknown>).provider as string,
            ...(modelSettings as Record<string, unknown>),
          })

          // If model returned a file immediately, proceed with upload
          if (result && 'file' in result) {
            let assetData: { alt?: string; id: number | string }
            if (typeof pluginConfig.mediaUpload === 'function') {
              assetData = await pluginConfig.mediaUpload(
                result,
                {
                  collection: uploadCollectionSlug as string,
                  request: req,
                },
              )
            } else {
              assetData = await req.payload.create({
                collection: uploadCollectionSlug as string,
                data: { alt: text },
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
            const externalTaskId = result.jobId || result.taskId
            const status = result.status || 'queued'
            const progress = result.progress ?? 0

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
          req.payload.logger.error(
            // @ts-expect-error
            error?.type || (error as Error).message,
            'Error generating upload: ',
          )
          const message =
            error && typeof error === 'object' && 'message' in error
              ? (error as Error).message
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
        console.log('videogenWebhook --> ', req)
        try {
          const urlAll = new URL(req.url || '')
          const qpSecret = urlAll.searchParams.get('secret') || ''
          const headerSecret = req.headers.get('x-webhook-secret') || ''
          const falSecret = process.env.FAL_WEBHOOK_SECRET
          const legacySecret = process.env.VIDEOGEN_WEBHOOK_SECRET
          const provided = qpSecret || headerSecret
          // TODO: fal is failing because of auth but webhook seem to work
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
            (body &&
              (body.taskId ||
                body.request_id ||
                body.gateway_request_id ||
                body.request?.request_id)) ||
            undefined
          const error = body?.error || body?.data?.error || body?.response?.error

          // Update AI Job row by task_id (and instructionId)
          const jobSearch = await req.payload.find({
            collection: PLUGIN_AI_JOBS_TABLE,
            depth: 0,
            limit: 1,
            where: {
              and: [
                { task_id: { equals: requestId } },
                { instructionId: { equals: instructionId } },
              ],
            },
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
