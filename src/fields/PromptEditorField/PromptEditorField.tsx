'use client'

import type { TextareaFieldClientProps } from 'payload'

import { FieldDescription, FieldLabel, useConfig, useField } from '@payloadcms/ui'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Mention, MentionsInput } from 'react-mentions/dist/react-mentions.cjs.js'

import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { defaultStyle } from './defaultStyle.js'

export const PromptEditorField: React.FC<TextareaFieldClientProps> = (props) => {
  const { field, path: pathFromContext } = props
  const { setValue, value: payloadValue } = useField<string>({
    path: pathFromContext,
  })

  const [localValue, setLocalValue] = useState(payloadValue || '')
  const hasInitialized = useRef(false)

  const { activeCollection, promptEditorSuggestions } = useInstructions()
  const { config } = useConfig()

  const suggestions = useMemo(
    () =>
      promptEditorSuggestions.map((suggestion: string) => ({
        id: suggestion,
        display: suggestion,
      })),
    [promptEditorSuggestions],
  )

  // Extract document ID from URL if available (to get specific filenames)
  const [documentData, setDocumentData] = useState<null | Record<string, unknown>>(null)
  
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') {
      return
    }

    // Allow time for verify window.location is stable (unlikely to change but good practice)
    const segments = window.location.pathname.split('/')
    const collectionsIndex = segments.indexOf('collections')
    
    if (collectionsIndex > -1 && segments.length > collectionsIndex + 2) {
      const urlCollectionSlug = segments[collectionsIndex + 1]
      const urlId = segments[collectionsIndex + 2]

      // Only fetch if we are editing instructions for the same collection we are viewing
      // and we haven't fetched yet (or ID changed)
      if (urlCollectionSlug === activeCollection && urlId && urlId !== 'create') {
         const fetchDocument = async () => {
           try {
              
             const response = await fetch(`${String(config.serverURL)}${String(config.routes.api)}/${String(urlCollectionSlug)}/${String(urlId)}`)
             if (response.ok) {
               const data = await response.json()
               setDocumentData(data)
             }
           } catch (_err) {
             // Ignore error
           }
         }
         void fetchDocument()
      }
    }
  }, [activeCollection, config])

  // Extract all upload fields from the current collection schema
  const imageFieldSuggestions = useMemo(() => {
    const suggestions: { display: string; id: string }[] = []
    
    // Use activeCollection from context which holds the target collection slug
    const targetSlug = activeCollection
    
    if (!targetSlug || !config?.collections) {
      return []
    }

    const collection = config.collections.find((c) => c.slug === targetSlug)
    if (!collection?.fields) {
      return []
    }

    const uploadFields: { hasMany: boolean; name: string }[] = []

    // Recursive function to find upload fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findUploadFields = (fields: any[], prefix = ''): void => {
      for (const field of fields) {
        if (field.type === 'upload' && field.name) {
          const fieldPath = prefix ? `${prefix}.${String(field.name)}` : String(field.name)
          uploadFields.push({ name: fieldPath, hasMany: field.hasMany === true })
        }
        // Check nested fields in groups, arrays, etc.
        if (field.fields && Array.isArray(field.fields)) {
          const newPrefix = field.name ? (prefix ? `${prefix}.${String(field.name)}` : String(field.name)) : prefix
          findUploadFields(field.fields, newPrefix)
        }
      }
    }

    findUploadFields(collection.fields)
    
    // Add generic field names (base suggestions) - ONLY for single uploads (not hasMany arrays)
    uploadFields.forEach(({ name, hasMany }) => {
      // User requested to hide the array itself for hasMany fields
      if (!hasMany) {
        suggestions.push({ id: name, display: name })
      }
    })

    // If we have document data, add specific filename suggestions
    if (documentData) {
      uploadFields.forEach(({ name, hasMany }) => {
        const value = documentData[name] // Note: nested access logic simplified for now
        
        // Helper to extract filename from media doc (which might be ID or object)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getFilename = (item: any): null | string => {
           if (typeof item === 'object' && item && (item.filename || item.name)) {
             return item.filename || item.name
           }
           // If it's just an ID, we can't show filename without populating. 
           // Assuming compose view usually fetches with depth > 0 or we rely on what we have.
           return null
        }

        if (value) {
           if (hasMany && Array.isArray(value)) {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             value.forEach((item: any) => {
               const fname = getFilename(item)
               if (fname) {
                 const suggestion = `${name}:${fname}`
                 suggestions.push({ id: suggestion, display: suggestion })
               }
             })
           } else if (!hasMany) {
             // Single image - we already added the base name above.
             // We can optionally add the specific filename too if desired, 
             // but user request focused on arrays.
             // Adding the specific filename option for Single images too as it's explicit.
             const fname = getFilename(value)
             if (fname) {
                 const suggestion = `${name}:${fname}`
                 suggestions.push({ id: suggestion, display: suggestion })
             }
           }
        }
      })
    }
    
    return suggestions
  }, [activeCollection, config, documentData])

  useEffect(() => {
    if (!hasInitialized.current || payloadValue === '') {
      setLocalValue(payloadValue || '')
      hasInitialized.current = true
    }
  }, [payloadValue])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    // Also update Payload value immediately to prevent loss when Save is clicked
    setValue(newValue)
  }, [setValue])

  const handleBlur = useCallback(() => {
    setValue(localValue)
  }, [localValue, setValue])

  const displayTransform = useCallback((id: string) => `{{ ${id} }}`, [])
  const imageDisplayTransform = useCallback((id: string) => `@${id}`, [])

  return (
    <div className="field-type textarea">
      <FieldLabel label={field.label} />
      <MentionsInput
        onBlur={handleBlur}
        onChange={handleChange}
        placeholder="Type {{ for fields }} or @imageField for images. For specific images use @imageField:filename.jpg"
        style={defaultStyle}
        value={localValue}
      >
        <Mention
          data={suggestions}
          displayTransform={displayTransform}
          markup="{{__id__}}"
          style={{
            backgroundColor: 'var(--theme-elevation-100)',
            padding: '2px 0',
          }}
          trigger="{"
        />
        <Mention
          data={imageFieldSuggestions}
          displayTransform={imageDisplayTransform}
          markup="@__id__"
          style={{
            backgroundColor: 'var(--theme-elevation-150)',
            padding: '2px 0',
          }}
          trigger="@"
        />
      </MentionsInput>
      <FieldDescription description={field?.admin?.description} path="" />
    </div>
  )
}
