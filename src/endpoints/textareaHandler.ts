import type { DataFromCollectionSlug, Payload } from 'payload'

import { GenerationModels } from '../ai/models/index.js'
import { PLUGIN_INSTRUCTIONS_TABLE, PLUGIN_NAME } from '../defaults.js'
import { registerEditorHelper } from '../libraries/handlebars/helpers.js'
import { assignPrompt } from './assignPrompt.js'

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
  const { action, actionParams, context, locale, stream } = options
  const { collections } = payload.config
  const collection = collections.find((collection) => collection.slug === PLUGIN_INSTRUCTIONS_TABLE)
  const schemaPath = instructions['schema-path'] as string
  const fieldType = instructions['field-type'] as string
  const fieldName = schemaPath?.split('.').pop()

  let outputSchema
  if (fieldType === 'richText') {
    try {
      const { custom: { [PLUGIN_NAME]: { editorConfig = {} } = {} } = {} } = collection.admin
      const { schema: editorSchema = {} } = editorConfig
      outputSchema = editorSchema
    } catch (e) {
      console.error('editorSchema:', e)
    }
  } else {
    // todo use valid json schema
    outputSchema = { [schemaPath]: '' }
  }

  const { prompt: promptTemplate = '' } = instructions

  registerEditorHelper(payload, schemaPath)

  const { defaultLocale, locales = [] } = payload.config.localization || {}
  const localeData = locales.find((l) => {
    return l.code === locale
  })

  const localeInfo = localeData?.label[defaultLocale] || locale

  const model = GenerationModels.find((model) => model.id === instructions['model-id'])
  const settingsName = model.settings?.name
  const modelOptions = instructions[settingsName] || {}

  const prompts = await assignPrompt(action, {
    type: fieldType,
    actionParams,
    context,
    doc,
    field: fieldName,
    layout: instructions.layout,
    systemPrompt: instructions.system,
    template: promptTemplate,
  })

  console.log('Running handler with fieldName:', fieldName)
  return model
    .handler?.(prompts.prompt, {
      ...modelOptions,
      layout: prompts.layout,
      locale: localeInfo,
      schema: outputSchema,
      stream,
      system: prompts.system,
    })
    .catch((error) => {
      console.error('Error: endpoint - generating text:', error)
      return new Response(JSON.stringify(error.message), { status: 500 })
    })
}
