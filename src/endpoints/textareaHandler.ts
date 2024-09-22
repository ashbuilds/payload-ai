import type { DataFromCollectionSlug, Payload } from 'payload'

import { GenerationModels } from '../ai/models/index.js'
import { lexicalSchema } from '../ai/schemas/lexical.schema.js'
import { PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js'
import { registerEditorHelper } from '../libraries/handlebars/helpers.js'
import { assignPrompt } from './assignPrompt.js'
import dot from 'dot-object'
import { z } from 'zod'
import { inferSchema } from '../utilities/inferSchema.js'

export const textareaHandler = async ({
  doc,
  instructions,
  options,
  payload,
}: {
  doc: object
  instructions: DataFromCollectionSlug<string>
  options: any
  payload: Payload
}) => {
  const { action, actionParams, context, locale } = options
  const { collections } = payload.config
  const collection = collections.find((collection) => collection.slug === PLUGIN_INSTRUCTIONS_TABLE)
  const schemaPath = instructions['schema-path'] as string
  const fieldType = instructions['field-type'] as string
  const fieldName = schemaPath?.split('.').pop()

  let zodSchema
  if (fieldType === 'richText') {
    try {
      ;({ editorConfig: { schema: zodSchema = lexicalSchema() } = {} } = collection.custom || {})
    } catch (e) {
      console.error('editorSchema:', e)
    }
  } else {
    zodSchema = inferSchema({ [schemaPath]: "" } as Record<string, unknown>)
  }

  const { prompt: promptTemplate = '' } = instructions

  registerEditorHelper(payload, schemaPath)

  const { defaultLocale, locales = [] } = payload.config.localization || {}
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
  const modelOptions = instructions[settingsName] as {
    layout: string
    system: string
  }

  const prompts = await assignPrompt(action, {
    type: fieldType,
    actionParams,
    context,
    doc,
    field: fieldName,
    layout: modelOptions.layout,
    systemPrompt: modelOptions.system,
    template: promptTemplate,
  })

  console.log('Running handler with fieldName:', fieldName)
  return model
    .handler?.(prompts.prompt, {
      ...modelOptions,
      ...opt,
      layout: prompts.layout,
      schema: zodSchema,
      system: prompts.system,
    })
    .catch((error) => {
      console.error('Error: endpoint - generating text:', error)
      return new Response(JSON.stringify(error.message), { status: 500 })
    })
}
