import type { ImagePart } from 'ai'
import type { Field, PayloadRequest } from 'payload'

import * as process from 'node:process'

import type { PluginConfig } from '../types.js'

import { checkAccess } from '../access/checkAccess.js'
import {
  PLUGIN_AI_JOBS_TABLE,
  PLUGIN_API_ENDPOINT_VIDEOGEN_WEBHOOK,
  PLUGIN_INSTRUCTIONS_TABLE,
} from '../defaults.js'
import { registerEditorHelper } from '../libraries/handlebars/helpers.js'
import { replacePlaceholders } from '../libraries/handlebars/replacePlaceholders.js'
import { buildSmartPrompt, isGenericPrompt } from '../utilities/buildSmartPrompt.js'
import { extractImageData } from '../utilities/images/extractImageData.js'
import { type FetchableImage, fetchImages } from '../utilities/images/fetchImages.js'
import { getFieldBySchemaPath } from '../utilities/fields/getFieldBySchemaPath.js'
import { lexicalToPromptTemplate } from '../utilities/lexical/lexicalToPromptTemplate.js'
import { resolveImageReferences } from '../utilities/images/resolveImageReferences.js'
import { extendContextWithPromptFields } from '../utilities/buildPromptUtils.js'

/**
 * Image/video/audio upload generation endpoint handler.
 * Uses payload.ai.generateMedia for media generation.
 */
export const uploadHandler = (pluginConfig: PluginConfig) => async (req: PayloadRequest) => {
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
          collection: collectionSlug as string,
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
      ...docData,
      ...data.doc,
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

    let { prompt: promptTemplate = '' } = instructions
    
    // Convert Lexical JSON to string template if needed
    if (promptTemplate && typeof promptTemplate === 'object') {
       promptTemplate = lexicalToPromptTemplate(promptTemplate)
    }

    const { images: sampleImages = [] } = instructions
    const schemaPath = String(instructions['schema-path'])
    registerEditorHelper(req.payload, schemaPath)

    // Smart fallback: if prompt is generic, build a contextual prompt from field metadata
    if (isGenericPrompt(promptTemplate as string)) {
      promptTemplate = buildSmartPrompt({
        documentData: contextData,
        payload: req.payload,
        schemaPath,
      })

      if (pluginConfig.debugging) {
        req.payload.logger.info(
          { smartPrompt: promptTemplate },
          `— AI Plugin: Using smart fallback prompt for ${schemaPath}`,
        )
      }
    }

    const extendedContext = extendContextWithPromptFields(
      contextData,
      { type: String(instructions['field-type']), collection: collectionSlug },
      pluginConfig,
    )

    if (pluginConfig.debugging) {
      req.payload.logger.info(
        {
          contextDataKeys: Object.keys(contextData),
          contextDataSample: Object.fromEntries(
            Object.entries(contextData).map(([k, v]) => [k, typeof v === 'object' ? `[object]` : v])
          ),
          promptTemplate: promptTemplate,
        },
        `— AI Plugin: DEBUG upload context before replacePlaceholders`,
      )
    }

    const text = await replacePlaceholders(promptTemplate as string, extendedContext)
    const uploadCollectionSlug = instructions['relation-to']

    // Resolve @field:filename references from the prompt
    const { images: resolvedImages, processedPrompt } = await resolveImageReferences(
      text,
      contextData,
      req,
      collectionSlug,
    )

    // Extract hardcoded URLs from the processed prompt and merge with resolved images and sample images
    const images = [
      ...extractImageData(processedPrompt),
      ...resolvedImages,
      ...(sampleImages as unknown[]),
    ] as FetchableImage[]

    // Process images - convert to ImagePart format using helper
    const editImages: ImagePart[] = await fetchImages(req, images)

    let promptToUse = processedPrompt
    let targetField: Field | null | undefined

    try {
      const targetCollection = req.payload.config.collections.find(
        (c) => c.slug === collectionSlug,
      )
      if (targetCollection && schemaPath) {
        targetField = getFieldBySchemaPath(targetCollection, schemaPath)
      }
    } catch (e) {
      req.payload.logger.error(e, '— AI Plugin: Error finding field for hooks')
    }

    if (targetField && (targetField as any).custom?.ai?.beforeGenerate) {
      const beforeHooks = (targetField as any).custom.ai.beforeGenerate as Array<
        (args: any) => Promise<any>
      >
      for (const hook of beforeHooks) {
        const result = await hook({
          doc: contextData,
          field: targetField,
          headers: req.headers,
          instructions,
          payload: req.payload,
          prompt: promptToUse,
          req,
        })

        if (result) {
          if (result.prompt) {
            promptToUse = result.prompt
          }
          if (result.instructions) {
            instructions = {
              ...instructions,
              ...result.instructions,
            }
          }
        }
      }
    }

    if (pluginConfig.debugging) {
      req.payload.logger.info(
        { text: promptToUse },
        `— AI Plugin: Executing media generation`,
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

    // Get model settings
    // Re-evaluate settings name and settings in case instructions changed
    const modelId = instructions['model-id']
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

    // Get model settings from instruction
    const instructionSettings = (instructions[settingsName] || {}) as Record<string, unknown>

    // Fallback to AISettings global defaults if instruction-level settings are missing
    let globalDefaults: Record<string, unknown> = {}
    if (!instructionSettings.provider || !instructionSettings.model) {
      try {
        const aiSettings = await req.payload.findGlobal({
          slug: 'ai-providers',
          context: { unsafe: true }, // Get decrypted values for internal use
        })

        // Map modelId to the corresponding default settings key
        const defaultsKey =
          modelId === 'image'
            ? 'image'
            : modelId === 'video'
              ? 'video'
              : modelId === 'tts'
                ? 'tts'
                : undefined

        if (defaultsKey && aiSettings?.defaults?.[defaultsKey]) {
          globalDefaults = aiSettings.defaults[defaultsKey] as Record<string, unknown>

          if (pluginConfig.debugging) {
            req.payload.logger.info(
              { globalDefaults },
              `— AI Plugin: Using AISettings defaults for ${modelId}`,
            )
          }
        }
      } catch (e) {
        req.payload.logger.error(e, '— AI Plugin: Error fetching AISettings defaults')
      }
    }

    // Merge: instruction settings take priority over global defaults
    // Filter out null/undefined values so they don't overwrite valid defaults
    const filteredInstructionSettings = Object.fromEntries(
      Object.entries(instructionSettings).filter(([_, v]) => v != null),
    )
    const modelSettings = {
      ...globalDefaults,
      ...filteredInstructionSettings,
    }

    const generateParams = {
      callbackUrl,
      images: editImages,
      instructionId,
      model: modelSettings.model as string,
      prompt: promptToUse,
      provider: modelSettings.provider as string,
      ...modelSettings,
    }

    if (pluginConfig.debugging) {
      req.payload.logger.info(
        generateParams,
        '— AI Plugin: Final generation parameters for media',
      )
    }

    // Use payload.ai.generateMedia directly! 🎉
    const result = await req.payload.ai.generateMedia(generateParams)

    if (targetField && (targetField as any).custom?.ai?.afterGenerate) {
      const afterHooks = (targetField as any).custom.ai.afterGenerate as Array<
        (args: any) => Promise<any>
      >
      for (const hook of afterHooks) {
        await hook({
          doc: contextData,
          field: targetField,
          headers: req.headers,
          instructions,
          payload: req.payload,
          req,
          result,
        })
      }
    }

    // If model returned files immediately, proceed with upload
    if (result && 'files' in result && Array.isArray(result.files) && result.files.length > 0) {
      const uploadedDocs: Array<{ alt?: string; id: number | string }> = []

      for (const file of result.files) {
        let assetData: { alt?: string; id: number | string }
        
        // Create a synthetic result for the single file to pass to mediaUpload
        const singleFileResult = {
          files: [file],
        }

        if (typeof pluginConfig.mediaUpload === 'function') {
          const uploadResult = await pluginConfig.mediaUpload(singleFileResult, {
            collection: uploadCollectionSlug as string,
            request: req,
          })
          assetData = { id: uploadResult.id, alt: (uploadResult as any).alt }
        } else {
          const created = await req.payload.create({
            collection: uploadCollectionSlug as string,
            data: { alt: text },
            file, // Pass the file object directly: { data, mimetype, name, size }
            req, // Pass req to ensure access control is applied
          })
          assetData = { id: created.id, alt: created.alt as string }
        }

        if (assetData.id) {
          uploadedDocs.push(assetData)
        }
      }

      if (uploadedDocs.length === 0) {
        req.payload.logger.error(
          'Error uploading generated media, is your media upload function correct?',
        )
        throw new Error('Error uploading generated media!')
      }

      // Check if target field supports multiple values
      let hasMany = false
      if (targetField) {
        if (targetField.type === 'relationship' || targetField.type === 'upload' || targetField.type === 'select') {
          hasMany = (targetField as any).hasMany === true
        }
      }

      if (hasMany) {
         return new Response(
          JSON.stringify({
            result: uploadedDocs.map((d) => ({
              id: d.id,
              alt: d.alt,
            })),
          }),
        )
      }

      return new Response(
        JSON.stringify({
          result: {
            id: uploadedDocs[0].id,
            alt: uploadedDocs[0].alt,
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
      '— AI Plugin: Error generating media upload:',
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
}
