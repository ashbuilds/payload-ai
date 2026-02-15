import type { Endpoint } from 'payload'

export const promptMentionsEndpoint: Endpoint = {
  handler: async (req) => {
    const trigger = String(req.query.trigger ?? '@')
    const q = String(req.query.q ?? '').trim()
    const collectionSlug = String(req.query.collection ?? '')
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

      const suggestions: { display: string; id: string }[] = []

      // Recursive function to find fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const findFields = (fields: any[], prefix = ''): void => {
        for (const field of fields) {
          if (field.name) {
            const fieldPath = prefix ? `${prefix}.${String(field.name)}` : String(field.name)
            // Add field to suggestions if it matches query
            if (!q || fieldPath.toLowerCase().includes(q.toLowerCase())) {
              suggestions.push({
                display: fieldPath,
                id: fieldPath, // Handlebars expects {{path}}
              })
            }
          }
          
          // Recurse into groups, arrays, etc.
          if (field.fields && Array.isArray(field.fields)) {
             const newPrefix = field.name ? (prefix ? `${prefix}.${String(field.name)}` : String(field.name)) : prefix
             findFields(field.fields, newPrefix)
          }
          
          // Handle tabs
          if (field.tabs && Array.isArray(field.tabs)) {
            field.tabs.forEach((tab: any) => {
               findFields(tab.fields, prefix)
            })
          }
        }
      }

      findFields(collection.fields)
      
      return Response.json({
        items: suggestions.map((s) => ({
          ...s,
          value: s.id, // Value inserted into editor
        })),
      })
    }

    // Handle Images (@)
    if (trigger === '@') {
      const collection = req.payload.config.collections.find((c) => c.slug === collectionSlug)
       if (!collection) {
        return Response.json({ items: [] })
      }

      const suggestions: { display: string; id: string }[] = []
      const uploadFields: { hasMany: boolean; name: string }[] = []

      // Find upload fields
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const findUploadFields = (fields: any[], prefix = ''): void => {
        for (const field of fields) {
          if (field.type === 'upload' && field.name) {
            const fieldPath = prefix ? `${prefix}.${String(field.name)}` : String(field.name)
            uploadFields.push({ name: fieldPath, hasMany: field.hasMany === true })
          }
           if (field.fields && Array.isArray(field.fields)) {
             const newPrefix = field.name ? (prefix ? `${prefix}.${String(field.name)}` : String(field.name)) : prefix
             findUploadFields(field.fields, newPrefix)
           }
            if (field.tabs && Array.isArray(field.tabs)) {
            field.tabs.forEach((tab: any) => {
               findUploadFields(tab.fields, prefix)
            })
          }
        }
      }
      
      findUploadFields(collection.fields)

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
             collection: collectionSlug,
             id,
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

      return Response.json({
        items: suggestions.map((s) => ({
          ...s,
          value: s.id,
        })),
      })
    }

    return Response.json({ items: [] })
  },
  method: 'get',
  path: '/prompt-mentions',
}
