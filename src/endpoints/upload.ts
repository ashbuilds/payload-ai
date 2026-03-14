import type { ImagePart } from 'ai'
import type { Field, PayloadRequest } from 'payload'

import type { MediaResult } from '../ai/core/media/types.js'
import type {
  AfterGenerateHook,
  BeforeGenerateHook,
  CustomGenerateHook,
  PluginConfig,
} from '../types.js'

import {
  PLUGIN_AI_JOBS_TABLE,
  PLUGIN_API_ENDPOINT_VIDEOGEN_WEBHOOK,
  PLUGIN_INSTRUCTIONS_TABLE,
} from '../defaults.js'
import { renderTemplate } from '../libraries/templates/renderTemplate.js'
import { getFieldAIConfig, toHookArray } from '../utilities/ai/getFieldAIConfig.js'
import { resolveEffectiveInstructionSettings } from '../utilities/ai/resolveEffectiveInstructionSettings.js'
import { extendContextWithPromptFields } from '../utilities/buildPromptUtils.js'
import { buildSmartPrompt, isGenericPrompt } from '../utilities/buildSmartPrompt.js'
import { getFieldBySchemaPath } from '../utilities/fields/getFieldBySchemaPath.js'
import { extractImageData } from '../utilities/images/extractImageData.js'
import { type FetchableImage, fetchImages } from '../utilities/images/fetchImages.js'
import { resolveImageReferences } from '../utilities/images/resolveImageReferences.js'
import { lexicalToPromptTemplate } from '../utilities/lexical/lexicalToPromptTemplate.js'
import { resolveServerURL } from '../utilities/runtime/resolveServerURL.js'
import { sanitizeLog } from '../utilities/sanitizeLog.js'

/**
 * Image/video/audio upload generation endpoint handler.
 * Uses payload.ai.generateMedia for media generation.
 */
export const uploadHandler = (pluginConfig: PluginConfig) => async (req: PayloadRequest) => {
  try {
    // Check authentication and authorization first
    const data = await req.json?.()

    const { collectionSlug, documentId, fieldPath = '', options } = data
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
      {
        fieldPath: String(fieldPath || ''),
        payload: req.payload,
        schemaPath,
      },
    )

    if (pluginConfig.debugging) {
      req.payload.logger.info(
        sanitizeLog({
          contextDataKeys: Object.keys(contextData),
          contextDataSample: Object.fromEntries(
            Object.entries(contextData).map(([k, v]) => [
              k,
              typeof v === 'object' ? `[object]` : v,
            ]),
          ),
          promptTemplate,
        }),
        `— AI Plugin: DEBUG upload context before template rendering`,
      )
    }

    const text = await renderTemplate(promptTemplate as string, extendedContext, {
      fieldPath: String(fieldPath || ''),
      payload: req.payload,
      schemaPath,
    })
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
      const targetCollection = req.payload.config.collections.find((c) => c.slug === collectionSlug)
      if (targetCollection && schemaPath) {
        targetField = getFieldBySchemaPath(targetCollection, schemaPath)
      }
    } catch (e) {
      req.payload.logger.error(e, '— AI Plugin: Error finding field for hooks')
    }

    const aiConfig = getFieldAIConfig(targetField)
    const beforeHooks = toHookArray<BeforeGenerateHook>(aiConfig?.beforeGenerate)

    for (const hook of beforeHooks) {
      if (!targetField) {
        break
      }

      const hookResult = await hook({
        doc: contextData,
        field: targetField,
        fieldPath: String(fieldPath || ''),
        headers: req.headers,
        instructions,
        payload: req.payload,
        prompt: promptToUse,
        req,
      })

      if (hookResult) {
        if (hookResult.prompt) {
          promptToUse = hookResult.prompt
        }
        if (hookResult.instructions) {
          instructions = {
            ...instructions,
            ...hookResult.instructions,
          }
        }
      }
    }

    if (pluginConfig.debugging && beforeHooks.length > 0) {
      req.payload.logger.info(
        sanitizeLog({ hooks: beforeHooks.length, schemaPath }),
        '— AI Plugin: Executed beforeGenerate hooks for upload field',
      )
    }

    if (pluginConfig.debugging) {
      req.payload.logger.info(sanitizeLog({ text: promptToUse }), `— AI Plugin: Executing media generation`)
    }

    // Prepare callback URL for async jobs
    const serverURL = resolveServerURL(req)

    const callbackUrl = serverURL
      ? `${serverURL.replace(/\/$/, '')}/api${PLUGIN_API_ENDPOINT_VIDEOGEN_WEBHOOK}?instructionId=${instructionId}`
      : undefined

    const modelId = instructions['model-id']
    const aiSettings = await req.payload.findGlobal({
      slug: 'ai-providers',
      context: { unsafe: true },
    })
    const { effectiveSettings: modelSettings, settingsName } = resolveEffectiveInstructionSettings({
      defaults: aiSettings?.defaults as Record<string, unknown> | undefined,
      instructions,
    })

    if (!settingsName) {
      throw new Error(`Unsupported model-id: ${String(modelId)}`)
    }

    const generateParams = {
      callbackUrl,
      images: editImages,
      instructionId,
      model: modelSettings.model as string,
      prompt: promptToUse,
      provider: modelSettings.provider as string,
      providerOptions: modelSettings,
      ...modelSettings,
    }

    if (pluginConfig.debugging) {
      req.payload.logger.info(
        sanitizeLog(generateParams),
        '— AI Plugin: Final generation parameters for media',
      )
    }

    const customGenerateHooks = toHookArray<CustomGenerateHook>(aiConfig?.generate)
    let usedCustomGenerate = false
    let result: MediaResult | undefined

    for (const hook of customGenerateHooks) {
      if (!targetField) {
        break
      }

      const customResult = await hook({
        context: 'upload',
        doc: contextData,
        field: targetField,
        generateParams: generateParams as Record<string, unknown>,
        headers: req.headers,
        instructions,
        payload: req.payload,
        prompt: promptToUse,
        req,
      })

      if (customResult === undefined) {
        continue
      }

      if (customResult instanceof Response) {
        throw new Error(
          'custom.ai.generate for upload fields must return a media result object, not Response.',
        )
      }

      result = customResult
      usedCustomGenerate = true
      break
    }

    if (!result) {
      // Use payload.ai.generateMedia directly! 🎉
      result = await req.payload.ai.generateMedia(generateParams)
    }

    if (pluginConfig.debugging && customGenerateHooks.length > 0) {
      req.payload.logger.info(
        sanitizeLog({ hooks: customGenerateHooks.length, schemaPath, usedCustomGenerate }),
        '— AI Plugin: Evaluated custom generate hooks for upload field',
      )
    }

    const afterHooks = toHookArray<AfterGenerateHook>(aiConfig?.afterGenerate)

    for (const hook of afterHooks) {
      if (!targetField) {
        break
      }

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

    if (pluginConfig.debugging && afterHooks.length > 0) {
      req.payload.logger.info(
        sanitizeLog({ hooks: afterHooks.length, schemaPath }),
        '— AI Plugin: Executed afterGenerate hooks for upload field',
      )
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
          const uploadAlt =
            typeof (uploadResult as { alt?: unknown }).alt === 'string'
              ? (uploadResult as { alt?: string }).alt
              : undefined
          assetData = { id: uploadResult.id, alt: uploadAlt }
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
        if (
          targetField.type === 'relationship' ||
          targetField.type === 'upload' ||
          targetField.type === 'select'
        ) {
          hasMany = 'hasMany' in targetField && targetField.hasMany === true
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
    const errorType =
      error && typeof error === 'object' && 'type' in error
        ? String((error as { type?: unknown }).type)
        : undefined
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: unknown }).message)
        : String(error)

    req.payload.logger.error(`— AI Plugin: Error generating media upload: ${errorType || message}`)
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status:
        message.includes('Authentication required') || message.includes('Insufficient permissions')
          ? 401
          : 500,
    })
  }
}
