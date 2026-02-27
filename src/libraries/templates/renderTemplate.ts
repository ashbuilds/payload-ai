import { Liquid } from 'liquidjs'

import { getFieldInfo } from '../../utilities/fields/getFieldInfo.js'
import { lexicalToHTML } from '../../utilities/lexical/lexicalToHTML.js'
import { convertLegacyTemplateToLiquid } from './legacySyntax.js'

export interface TemplateRuntime {
  payload?: {
    collections?: Record<string, unknown>
  }
  schemaPath?: string
}

const TEMPLATE_CACHE_LIMIT = 500
const parsedTemplateCache = new Map<string, unknown>()

const templateEngine = new Liquid({
  jsTruthy: true,
  strictFilters: false,
  strictVariables: false,
})

const isLexicalEditorState = (
  value: unknown,
): value is { root: { children: unknown[]; type?: string } } => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const root = (value as { root?: unknown }).root
  if (!root || typeof root !== 'object') {
    return false
  }

  const children = (root as { children?: unknown }).children
  return Array.isArray(children)
}

const getCollectionSlugFromSchemaPath = (schemaPath?: string): string => {
  if (!schemaPath) {
    return ''
  }
  return schemaPath.split('.')[0] || ''
}

const normalizeLegacyFieldPath = (fieldPath: string): string => {
  return fieldPath
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/^\.\.\//, '')
    .replace(/^__item\d+\./, '')
    .replace(/^__with\d+\./, '')
}

const getRuntimeFromFilterContext = (ctx: unknown): TemplateRuntime => {
  const liquidFilterContext = ctx as {
    context?: {
      get?: (path: string | string[]) => unknown
    }
  }

  const getter = liquidFilterContext?.context?.get
  if (!getter) {
    return {}
  }

  try {
    const value = getter.call(liquidFilterContext.context, ['__templateRuntime'])
    if (value && typeof value === 'object') {
      return value as TemplateRuntime
    }
  } catch {
    // No-op: fallback to string path lookup below.
  }

  try {
    const value = getter.call(liquidFilterContext.context, '__templateRuntime')
    if (value && typeof value === 'object') {
      return value as TemplateRuntime
    }
  } catch {
    // No-op: ignore runtime lookup failures.
  }

  return {}
}

templateEngine.registerFilter('toHTML', async function (value: unknown, fieldPath?: string) {
  if (!isLexicalEditorState(value)) {
    return typeof value === 'string' ? value : ''
  }

  const runtime = getRuntimeFromFilterContext(this)
  const payloadCollections = runtime.payload?.collections
  if (!payloadCollections) {
    return ''
  }

  const collectionSlug = getCollectionSlugFromSchemaPath(runtime.schemaPath)
  const normalizedFieldPath = normalizeLegacyFieldPath(fieldPath || '')
  const schemaPath = normalizedFieldPath.startsWith(`${collectionSlug}.`)
    ? normalizedFieldPath
    : `${collectionSlug}.${normalizedFieldPath}`

  if (!collectionSlug || !normalizedFieldPath) {
    return ''
  }

  const fieldInfo = getFieldInfo(payloadCollections as any, schemaPath)
  if (
    !fieldInfo ||
    !('editor' in fieldInfo) ||
    !fieldInfo.editor ||
    typeof fieldInfo.editor !== 'object' ||
    !('editorConfig' in fieldInfo.editor) ||
    !fieldInfo.editor.editorConfig ||
    typeof fieldInfo.editor.editorConfig !== 'object' ||
    !('features' in fieldInfo.editor.editorConfig) ||
    !('lexical' in fieldInfo.editor.editorConfig) ||
    !('resolvedFeatureMap' in fieldInfo.editor.editorConfig)
  ) {
    return ''
  }

  return lexicalToHTML(value as any, fieldInfo.editor.editorConfig as any)
})

const getParsedTemplate = (template: string): unknown => {
  const cached = parsedTemplateCache.get(template)
  if (cached) {
    return cached
  }

  const parsed = templateEngine.parse(template)
  parsedTemplateCache.set(template, parsed)

  if (parsedTemplateCache.size > TEMPLATE_CACHE_LIMIT) {
    const oldestKey = parsedTemplateCache.keys().next().value
    if (oldestKey) {
      parsedTemplateCache.delete(oldestKey)
    }
  }

  return parsed
}

export const renderTemplate = async (
  template: string,
  values: object,
  runtime: TemplateRuntime = {},
): Promise<string> => {
  if (!template || typeof template !== 'string') {
    return ''
  }

  const normalizedTemplate = convertLegacyTemplateToLiquid(template)
  const parsed = getParsedTemplate(normalizedTemplate)
  const renderContext = {
    ...(values as Record<string, unknown>),
    __templateRuntime: runtime,
  }

  const rendered = await templateEngine.render(parsed as any, renderContext)
  return typeof rendered === 'string' ? rendered : String(rendered ?? '')
}
