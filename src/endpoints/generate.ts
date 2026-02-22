import type { ImagePart } from 'ai'
import type { Field, PayloadRequest } from 'payload'

import type { PluginConfig } from '../types.js'

import { checkAccess } from '../access/checkAccess.js'
import { filterEditorSchemaByNodes } from '../ai/utilities/filterEditorSchemaByNodes.js'
import { PLUGIN_INSTRUCTIONS_TABLE, PLUGIN_NAME } from '../defaults.js'
import { registerEditorHelper } from '../libraries/handlebars/helpers.js'
import { assignPrompt } from '../utilities/buildPromptUtils.js'
import { buildSmartPrompt, isGenericPrompt } from '../utilities/buildSmartPrompt.js'
import { fieldToJsonSchema } from '../utilities/fields/fieldToJsonSchema.js'
import { getFieldBySchemaPath } from '../utilities/fields/getFieldBySchemaPath.js'
import { extractImageData } from '../utilities/images/extractImageData.js'
import { type FetchableImage, fetchImages } from '../utilities/images/fetchImages.js'
import { resolveImageReferences } from '../utilities/images/resolveImageReferences.js'
import { lexicalToPromptTemplate } from '../utilities/lexical/lexicalToPromptTemplate.js'
import { sanitizeLog } from '../utilities/sanitizeLog.js'

/**
 * Text/rich-text generation endpoint handler.
 * Uses payload.ai.streamObject for structured text generation.
 */
export const generateHandler = (pluginConfig: PluginConfig) => async (req: PayloadRequest) => {
  try {
    // Check authentication and authorization first
    await checkAccess(req, pluginConfig)

    const data = await req.json?.()

    const { allowedEditorNodes = [], locale = 'en', options } = data
    const { action, actionParams, instructionId } = options
    let contextData = data.doc

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

    const { defaultLocale, locales = [] } = req.payload.config.localization || {}

    // If translating from default locale, we need to fetch the original content
    if (action === 'Translate' && actionParams?.translateFromDefault && contextData?.id) {
      try {
        const schemaPath = String(instructions['schema-path'])
        const parts = (schemaPath || '').split('.') || []
        const collectionName = parts[0]

        if (collectionName && defaultLocale) {
          const originalDoc = await req.payload.findByID({
            id: contextData.id,
            collection: collectionName as any,
            locale: defaultLocale,
            req,
          })
          if (originalDoc) {
            contextData = { ...contextData, ...originalDoc }
          }
        }
      } catch (e) {
        req.payload.logger.error(
          e,
          '— AI Plugin: Error fetching default locale document for translation',
        )
      }
    }

    const { custom: { [PLUGIN_NAME]: { editorConfig = {} } = {} } = {} } = collection.admin
    const { schema: editorSchema = {} } = editorConfig
    let { prompt: promptTemplate = '' } = instructions

    // Convert Lexical JSON to string template if needed
    if (promptTemplate && typeof promptTemplate === 'object') {
      promptTemplate = lexicalToPromptTemplate(promptTemplate)
    }

    // Smart fallback: if prompt is generic, build a contextual prompt from field metadata
    if (isGenericPrompt(promptTemplate)) {
      const schemaPath = String(instructions['schema-path'])
      promptTemplate = buildSmartPrompt({
        documentData: contextData,
        payload: req.payload,
        schemaPath,
      })

      if (pluginConfig.debugging) {
        req.payload.logger.info(
          sanitizeLog({ smartPrompt: promptTemplate }),
          `— AI Plugin: Using smart fallback prompt for ${schemaPath}`,
        )
      }
    }

    let allowedEditorSchema = editorSchema
    if (allowedEditorNodes.length) {
      allowedEditorSchema = filterEditorSchemaByNodes(editorSchema, allowedEditorNodes)
      // Debug: Log what nodes were received and what definitions remain
      if (pluginConfig.debugging) {
        req.payload.logger.info(
          sanitizeLog({
            receivedNodes: allowedEditorNodes,
            remainingDefinitions: Object.keys(allowedEditorSchema.definitions || {}),
          }),
          '— AI Plugin: Schema filtering debug',
        )
      }
    }

    const schemaPath = String(instructions['schema-path'])
    const parts = (schemaPath || '').split('.') || []
    const collectionName = parts[0]
    const fieldName = parts.length > 1 ? parts[parts.length - 1] : ''

    registerEditorHelper(req.payload, schemaPath)

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
      req.payload.logger.info(sanitizeLog({ prompts }), `— AI Plugin: Executing text prompt on ${schemaPath}`)
    }

    // Build per-field JSON schema for structured generation when applicable
    let jsonSchema = allowedEditorSchema
    let targetField: Field | null | undefined

    try {
      const targetCollection = req.payload.config.collections.find((c) => c.slug === collectionName)
      if (targetCollection && fieldName) {
        targetField = getFieldBySchemaPath(targetCollection, schemaPath)
        const supported = [
          'array',
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
          // For array fields, use count from array-settings if available
          if (t === 'array') {
            const arraySettings = (instructions['array-settings'] || {}) as Record<string, unknown>
            const count = (arraySettings.count as number) || 3
            // Override the field's maxRows with the requested count
            const modifiedField = {
              ...targetField,
              maxRows: count,
              minRows: count,
            } as typeof targetField
            jsonSchema = fieldToJsonSchema(modifiedField, { nameOverride: fieldName })
          } else {
            jsonSchema = fieldToJsonSchema(targetField, { nameOverride: fieldName })
          }
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
          : instructions['model-id'] === 'array'
            ? 'array-settings'
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
      collectionName,
    )

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

    let promptToUse = processedPrompt
    let systemToUse = prompts.system

    // Execute beforeGenerate hooks
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
          system: systemToUse,
        })

        if (result) {
          if (result.prompt) {promptToUse = result.prompt}
          if (result.system) {systemToUse = result.system}
        }
      }
    }

    const generateParams = {
      images,
      maxTokens: modelSettings.maxTokens as number | undefined,
      model: modelSettings.model as string,
      prompt: promptToUse,
      provider: modelSettings.provider as string,
      providerOptions: {
        openai: {
          strictJsonSchema: true,
        },
      },
      schema: jsonSchema,
      system: systemToUse,
      temperature: modelSettings.temperature as number | undefined,
    }

    if (pluginConfig.debugging) {
      req.payload.logger.info(
        sanitizeLog(generateParams),
        '— AI Plugin: Final generation parameters for text/rich-text',
      )
    }

    const streamResult = await req.payload.ai.streamObject({
      ...generateParams,
      onFinish: async ({ object }) => {
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
              result: object,
            })
          }
        }
      },
    })

    return streamResult
  } catch (error) {
    req.payload.logger.error(error, '— AI Plugin: Error generating text content:')
    const message =
      error && typeof error === 'object' && 'message' in error
        ? (error as Error).message
        : String(error)
    return new Response(JSON.stringify({ error: message }), {
      headers: { 'Content-Type': 'application/json' },
      status:
        message.includes('Authentication required') || message.includes('Insufficient permissions')
          ? 401
          : 500,
    })
  }
}
