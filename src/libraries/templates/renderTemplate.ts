import { Liquid } from 'liquidjs'

import { getFieldInfo } from '../../utilities/fields/getFieldInfo.js'
import { lexicalToHTML } from '../../utilities/lexical/lexicalToHTML.js'
import { convertLegacyTemplateToLiquid } from './legacySyntax.js'

export interface TemplateRuntime {
  fieldPath?: string
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

const ARRAY_INDEX_PATTERN = /^(?:\d+|_index-\d+)$/

const getArrayIndex = (segment: string): null | number => {
  if (/^\d+$/.test(segment)) {
    return Number(segment)
  }

  const match = /^_index-(\d+)$/.exec(segment)
  return match ? Number(match[1]) : null
}

const getNestedValue = (value: unknown, segments: string[]): unknown => {
  let current = value

  for (const segment of segments) {
    if (current == null) {
      return undefined
    }

    if (Array.isArray(current)) {
      const index = getArrayIndex(segment)
      current = index != null ? current[index] : (current as unknown as Record<string, unknown>)[segment]
      continue
    }

    if (typeof current !== 'object') {
      return undefined
    }

    current = (current as Record<string, unknown>)[segment]
  }

  return current
}

type CurrentArrayScope = {
  arrayPath: string
  arrayPathSegments: string[]
  arrayValue: unknown[]
  currentIndex: number
  currentItem: Record<string, unknown>
  currentItemPath: string
}

const getCurrentArrayScope = (
  values: Record<string, unknown>,
  runtime: TemplateRuntime,
): CurrentArrayScope | null => {
  const fieldPath = String(runtime.fieldPath || '').trim()
  if (!fieldPath) {
    return null
  }

  const segments = fieldPath.split('.').filter(Boolean)
  if (segments.length < 2) {
    return null
  }

  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i]
    if (!ARRAY_INDEX_PATTERN.test(segment)) {
      continue
    }

    const currentIndex = getArrayIndex(segment)
    const arrayPathSegments = segments.slice(0, i)
    if (!arrayPathSegments.length || currentIndex == null) {
      continue
    }

    const arrayValue = getNestedValue(values, arrayPathSegments)
    const currentItem = getNestedValue(values, segments.slice(0, i + 1))

    if (!Array.isArray(arrayValue) || !currentItem || typeof currentItem !== 'object') {
      continue
    }

    return {
      arrayPath: arrayPathSegments.join('.'),
      arrayPathSegments,
      arrayValue,
      currentIndex,
      currentItem: currentItem as Record<string, unknown>,
      currentItemPath: segments.slice(0, i + 1).join('.'),
    }
  }

  return null
}

const setNestedValue = (
  target: Record<string, unknown>,
  segments: string[],
  value: unknown,
): Record<string, unknown> => {
  if (!segments.length) {
    return target
  }

  const nextTarget = { ...target }
  let current: Record<string, unknown> = nextTarget

  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]
    const existing = current[segment]
    const cloned =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {}

    current[segment] = cloned
    current = cloned
  }

  current[segments[segments.length - 1]] = value
  return nextTarget
}

const createCurrentRowArrayProxy = (
  arrayValue: unknown[],
  currentItem: Record<string, unknown>,
): unknown[] => {
  return new Proxy(arrayValue, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && !Reflect.has(target, prop) && prop in currentItem) {
        return currentItem[prop]
      }

      const value = Reflect.get(target, prop, receiver)
      return typeof value === 'function' ? value.bind(target) : value
    },
    getOwnPropertyDescriptor(target, prop) {
      if (typeof prop === 'string' && !(prop in target) && prop in currentItem) {
        return {
          configurable: true,
          enumerable: false,
          value: currentItem[prop],
          writable: false,
        }
      }

      return Object.getOwnPropertyDescriptor(target, prop)
    },
    has(target, prop) {
      return Reflect.has(target, prop) || (typeof prop === 'string' && prop in currentItem)
    },
  })
}

const buildRenderContext = (
  values: object,
  runtime: TemplateRuntime,
): Record<string, unknown> => {
  const baseValues = { ...(values as Record<string, unknown>) }
  const currentArrayScope = getCurrentArrayScope(baseValues, runtime)

  if (!currentArrayScope) {
    return {
      ...baseValues,
      __templateRuntime: runtime,
    }
  }

  const {
    arrayPath,
    arrayPathSegments,
    arrayValue,
    currentIndex,
    currentItem,
    currentItemPath,
  } = currentArrayScope
  const currentRowArrayProxy = createCurrentRowArrayProxy(arrayValue, currentItem)
  const valuesWithCurrentArrayAlias = setNestedValue(
    baseValues,
    arrayPathSegments,
    currentRowArrayProxy,
  )

  // `current` is the explicit, row-scoped alias for prompts authored on array item fields.
  // The array proxy keeps older full-path prompts like `voices.primaryText` working.
  return {
    ...valuesWithCurrentArrayAlias,
    __templateRuntime: runtime,
    current: currentItem,
    currentArrayPath: arrayPath,
    currentIndex,
    currentItemPath,
    item: currentItem,
  }
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
  const renderContext = buildRenderContext(values, runtime)

  const rendered = await templateEngine.render(parsed as any, renderContext)
  return typeof rendered === 'string' ? rendered : String(rendered ?? '')
}
