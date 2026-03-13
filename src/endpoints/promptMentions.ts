import type { Endpoint } from 'payload'

type Suggestion = { display: string; id: string }
type FieldSuggestion = Suggestion & { arrayPath?: string; relativeToArray?: string }
type UploadField = { hasMany: boolean; name: string }

const collectFieldSuggestions = (
  fields: any[],
  prefix = '',
  suggestions: FieldSuggestion[] = [],
  activeArrayPath = '',
): FieldSuggestion[] => {
  for (const field of fields) {
    const fieldPath = field.name
      ? prefix
        ? `${prefix}.${String(field.name)}`
        : String(field.name)
      : prefix
    const nextArrayPath = field.type === 'array' && field.name ? fieldPath : activeArrayPath

    if (field.name) {
      suggestions.push({
        arrayPath: activeArrayPath || undefined,
        id: fieldPath,
        display: fieldPath,
        relativeToArray:
          activeArrayPath && fieldPath.startsWith(`${activeArrayPath}.`)
            ? fieldPath.slice(activeArrayPath.length + 1)
            : undefined,
      })
    }

    if (field.fields && Array.isArray(field.fields)) {
      const newPrefix = field.name
        ? prefix
          ? `${prefix}.${String(field.name)}`
          : String(field.name)
        : prefix
      collectFieldSuggestions(field.fields, newPrefix, suggestions, nextArrayPath)
    }

    if (field.tabs && Array.isArray(field.tabs)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      field.tabs.forEach((tab: any) => {
        collectFieldSuggestions(tab.fields, prefix, suggestions, activeArrayPath)
      })
    }
  }

  return suggestions
}

const collectUploadFields = (
  fields: any[],
  prefix = '',
  uploadFields: UploadField[] = [],
): UploadField[] => {
  for (const field of fields) {
    if (field.type === 'upload' && field.name) {
      const fieldPath = prefix ? `${prefix}.${String(field.name)}` : String(field.name)
      uploadFields.push({ name: fieldPath, hasMany: field.hasMany === true })
    }

    if (field.fields && Array.isArray(field.fields)) {
      const newPrefix = field.name
        ? prefix
          ? `${prefix}.${String(field.name)}`
          : String(field.name)
        : prefix
      collectUploadFields(field.fields, newPrefix, uploadFields)
    }

    if (field.tabs && Array.isArray(field.tabs)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      field.tabs.forEach((tab: any) => {
        collectUploadFields(tab.fields, prefix, uploadFields)
      })
    }
  }

  return uploadFields
}

const mentionsResponse = (items: Suggestion[]) =>
  Response.json(
    {
      items: items.map((s) => ({
        ...s,
        value: s.id,
      })),
    },
    {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=120',
      },
    },
  )

const getRelativeSchemaPath = (schemaPath: string, collectionSlug: string): string => {
  if (!schemaPath) {
    return ''
  }

  return schemaPath.startsWith(`${collectionSlug}.`)
    ? schemaPath.slice(collectionSlug.length + 1)
    : schemaPath
}

const getCurrentArrayPath = (
  currentSchemaPath: string,
  collectionSlug: string,
  fieldSuggestions: FieldSuggestion[],
): null | string => {
  const relativeSchemaPath = getRelativeSchemaPath(currentSchemaPath, collectionSlug)
  let matchedArrayPath: null | string = null

  for (const suggestion of fieldSuggestions) {
    if (!suggestion.arrayPath) {
      continue
    }

    if (
      relativeSchemaPath === suggestion.arrayPath ||
      relativeSchemaPath.startsWith(`${suggestion.arrayPath}.`)
    ) {
      if (!matchedArrayPath || suggestion.arrayPath.length > matchedArrayPath.length) {
        matchedArrayPath = suggestion.arrayPath
      }
    }
  }

  return matchedArrayPath
}

const buildCurrentRowSuggestions = (
  currentSchemaPath: string,
  collectionSlug: string,
  fieldSuggestions: FieldSuggestion[],
): Suggestion[] => {
  const currentArrayPath = getCurrentArrayPath(currentSchemaPath, collectionSlug, fieldSuggestions)
  if (!currentArrayPath) {
    return []
  }

  const relativeSchemaPath = getRelativeSchemaPath(currentSchemaPath, collectionSlug)
  const currentFieldRelativePath = relativeSchemaPath.startsWith(`${currentArrayPath}.`)
    ? relativeSchemaPath.slice(currentArrayPath.length + 1)
    : ''

  const dedupe = new Set<string>()
  const suggestions: Suggestion[] = []

  for (const fieldSuggestion of fieldSuggestions) {
    if (
      fieldSuggestion.arrayPath !== currentArrayPath ||
      !fieldSuggestion.relativeToArray ||
      fieldSuggestion.relativeToArray === currentFieldRelativePath
    ) {
      continue
    }

    const id = `current.${fieldSuggestion.relativeToArray}`
    if (dedupe.has(id)) {
      continue
    }

    dedupe.add(id)
    suggestions.push({
      display: id,
      id,
    })
  }

  return suggestions
}

const filterFieldSuggestionsForArrayContext = (
  currentSchemaPath: string,
  collectionSlug: string,
  fieldSuggestions: FieldSuggestion[],
): FieldSuggestion[] => {
  const currentArrayPath = getCurrentArrayPath(currentSchemaPath, collectionSlug, fieldSuggestions)
  if (!currentArrayPath) {
    return fieldSuggestions
  }

  return fieldSuggestions.filter((fieldSuggestion) => {
    if (fieldSuggestion.id === currentArrayPath) {
      return true
    }

    if (!fieldSuggestion.relativeToArray) {
      return true
    }

    return fieldSuggestion.arrayPath !== currentArrayPath
  })
}

export const promptMentionsEndpoint: Endpoint = {
  handler: async (req) => {
    const trigger = String(req.query.trigger ?? '@')
    const q = String(req.query.q ?? '').trim()
    const collectionSlug = String(req.query.collection ?? '')
    const currentSchemaPath = String(req.query.schemaPath ?? '')
    const id = String(req.query.id ?? '')

    if (!collectionSlug) {
      return Response.json({ items: [] })
    }

    // Handle Fields (#)
    if (trigger === '#') {
      const collection = req.payload.config.collections.find((c) => c.slug === collectionSlug)
      if (!collection) {
        return Response.json({ items: [] })
      }

      const fieldSuggestions = collectFieldSuggestions(collection.fields)
      const scopedFieldSuggestions = filterFieldSuggestionsForArrayContext(
        currentSchemaPath,
        collectionSlug,
        fieldSuggestions,
      )
      const currentRowSuggestions = buildCurrentRowSuggestions(
        currentSchemaPath,
        collectionSlug,
        fieldSuggestions,
      )
      const combinedSuggestions = [...currentRowSuggestions, ...scopedFieldSuggestions]
      const suggestions =
        q.length === 0
          ? combinedSuggestions
          : combinedSuggestions.filter((item) => item.id.toLowerCase().includes(q.toLowerCase()))

      return mentionsResponse(suggestions)
    }

    // Handle Images (@)
    if (trigger === '@') {
      const collection = req.payload.config.collections.find((c) => c.slug === collectionSlug)
      if (!collection) {
        return Response.json({ items: [] })
      }

      const uploadFields = collectUploadFields(collection.fields)
      const suggestions: Suggestion[] = []

      // Add base field names
      uploadFields.forEach(({ name }) => {
        if (!q || name.toLowerCase().includes(q.toLowerCase())) {
          suggestions.push({ id: name, display: name })
        }
      })

      // If ID is provided, fetch document to get specific filenames
      if (id && id !== 'create') {
        try {
          const doc = await req.payload.findByID({
            id,
            collection: collectionSlug,
            depth: 1, // Need depth to get filename
            req,
          })

          if (doc) {
            uploadFields.forEach(({ name, hasMany }) => {
              // Access nested value
              const parts = name.split('.')
              let value = doc
              for (const part of parts) {
                value = (value as any)?.[part]
              }

              // Helper to extract filename
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const getFilename = (item: any): null | string => {
                if (typeof item === 'object' && item && (item.filename || item.name)) {
                  return item.filename || item.name
                }
                return null
              }

              if (value) {
                if (hasMany && Array.isArray(value)) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  value.forEach((item: any) => {
                    const fname = getFilename(item)
                    if (fname) {
                      const suggestion = `${name}:${fname}`
                      if (!q || suggestion.toLowerCase().includes(q.toLowerCase())) {
                        suggestions.push({ id: suggestion, display: suggestion })
                      }
                    }
                  })
                } else {
                  const fname = getFilename(value)
                  if (fname) {
                    const suggestion = `${name}:${fname}`
                    if (!q || suggestion.toLowerCase().includes(q.toLowerCase())) {
                      suggestions.push({ id: suggestion, display: suggestion })
                    }
                  }
                }
              }
            })
          }
        } catch (e) {
          console.error('Error fetching document for suggestions', e)
        }
      }

      return mentionsResponse(suggestions)
    }

    return Response.json({ items: [] })
  },
  method: 'get',
  path: '/prompt-mentions',
}
