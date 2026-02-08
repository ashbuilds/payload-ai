import { experimental_useObject as useObject } from '@ai-sdk/react'
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { toast, useConfig, useDocumentInfo, useField, useForm, useLocale } from '@payloadcms/ui'
import { jsonSchema } from 'ai'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ActionMenuItems, GenerateTextarea } from '../../../types.js'

import { filterEditorSchemaByNodes } from '../../../ai/utils/filterEditorSchemaByNodes.js'
import {
  PLUGIN_AI_JOBS_TABLE,
  PLUGIN_API_ENDPOINT_GENERATE,
  PLUGIN_API_ENDPOINT_GENERATE_UPLOAD,
  PLUGIN_INSTRUCTIONS_TABLE,
  PLUGIN_NAME,
} from '../../../defaults.js'
import { useFieldProps } from '../../../providers/FieldProvider/useFieldProps.js'
import { editorSchemaValidator } from '../../../utilities/editorSchemaValidator.js'
import { fieldToJsonSchema } from '../../../utilities/fieldToJsonSchema.js'
import { setSafeLexicalState } from '../../../utilities/setSafeLexicalState.js'
import { useHistory } from './useHistory.js'

type ActionCallbackParams = { action: ActionMenuItems; params?: unknown }

export const useGenerate = ({ instructionId }: { instructionId: string }) => {
  // Create a ref to hold the current instructionId
  const instructionIdRef = useRef(instructionId)

  // Update the ref whenever instructionId changes
  useEffect(() => {
    instructionIdRef.current = instructionId
  }, [instructionId])

  const { field, path: pathFromContext } = useFieldProps()
  const editorConfigContext = useEditorConfigContext()

  const { editor } = editorConfigContext

  const { config } = useConfig()
  const {
    routes: { api },
    serverURL,
  } = config

  const { setValue } = useField<any>({
    path: pathFromContext ?? '',
  })

  const { set: setHistory } = useHistory()

  // Async job UI state
  const [jobStatus, setJobStatus] = useState<string | undefined>(undefined)
  const [jobProgress, setJobProgress] = useState<number>(0)
  const [isJobActive, setIsJobActive] = useState<boolean>(false)

  // Track completion state for richText fields to prevent streaming errors
  const [richTextCompletedObject, setRichTextCompletedObject] = useState<any>(null)
  const [_isRichTextStreaming, setIsRichTextStreaming] = useState<boolean>(false)
  const isRichTextField = field?.type === 'richText'

  const { getData } = useForm()
  const { id: documentId, collectionSlug } = useDocumentInfo()

  const localFromContext = useLocale()

  // Reuse config from above instead of calling useConfig again
  const { collections } = config

  const collection = collections.find((collection) => collection.slug === PLUGIN_INSTRUCTIONS_TABLE)
  const { custom: { [PLUGIN_NAME]: { editorConfig = {} } = {} } = {} } = collection?.admin ?? {}
  const { schema: fullEditorSchema = {} } = editorConfig

  // Get the current editor's allowed nodes and filter the schema
  // This ensures client-side validation matches what the server expects
  const allowedEditorNodes = useMemo(() => {
    const nodes = Array.from(editor?._nodes?.keys() || [])
    // Debug: Log what nodes are registered in the editor
    if (nodes.length > 0) {
      console.log('[useGenerate] Editor registered nodes:', nodes)
    }
    return nodes
  }, [editor])

  const filteredEditorSchema = useMemo(() => {
    if (allowedEditorNodes.length > 0 && fullEditorSchema && Object.keys(fullEditorSchema).length > 0) {
      const filtered = filterEditorSchemaByNodes(fullEditorSchema, allowedEditorNodes)
      // Debug: Log what schema definitions remain after filtering
      console.log('[useGenerate] Filtered schema definitions:', Object.keys(filtered.definitions || {}))
      return filtered
    }
    return fullEditorSchema
  }, [fullEditorSchema, allowedEditorNodes])

  const memoizedValidator = useMemo(() => {
    return editorSchemaValidator(filteredEditorSchema)
  }, [filteredEditorSchema])

  const memoizedSchema = useMemo(
    () =>
      jsonSchema(filteredEditorSchema, {
        validate: (value) => {
          const isValid = memoizedValidator(value)

          if (isValid) {
            return {
              success: true,
              value,
            }
          } else {
            return {
              error: new Error('Invalid schema'),
              success: false,
            }
          }
        },
      }),
    [filteredEditorSchema, memoizedValidator],
  )

  // Active JSON schema for useObject based on field type
  const activeSchema = useMemo(() => {
    const f = field as any
    const fieldType = f?.type as string | undefined
    if (fieldType === 'richText') {
      return memoizedSchema
    }
    if (f && f.name && fieldType) {
      const schemaJson = fieldToJsonSchema(f)
      if (schemaJson && Object.keys(schemaJson).length > 0) {
        return jsonSchema(schemaJson)
      }
    }
    return undefined
  }, [field, memoizedSchema])

  const {
    isLoading: loadingObject,
    object,
    stop: objectStop,
    submit,
  } = useObject({
    api: `/api${PLUGIN_API_ENDPOINT_GENERATE}`,
    onError: (error: any) => {
      toast.error(`Failed to generate: ${error.message}`)
      console.error('Error generating object:', error)
      // Reset completion state on error for richText fields
      if (isRichTextField) {
        setRichTextCompletedObject(null)
        setIsRichTextStreaming(false)
      }
    },
    onFinish: (result) => {
      if (result.object && field) {
        if (field.type === 'richText') {
          // Mark streaming as complete FIRST
          setIsRichTextStreaming(false)

          // Store completed object in state for richText fields
          setRichTextCompletedObject(result.object)
          setHistory(result.object)

          // Validate that the state is complete before setting
          if (
            editor &&
            result.object &&
            result.object.root &&
            result.object.root.children &&
            Array.isArray(result.object.root.children) &&
            result.object.root.children.length > 0 &&
            result.object.root.type === 'root'
          ) {
            // For richText: Set editor state directly, then setValue after a delay
            // This prevents triggering field watchers with incomplete states during streaming
            requestAnimationFrame(() => {
              setSafeLexicalState(result.object, editor)
              // Set value AFTER editor state is set and streaming is complete
              // Use a longer delay to ensure editor state is fully applied
              setTimeout(() => {
                setValue(result.object)
              }, 150)
            })
          } else {
            // Validation failed - still try to set value but log warning
            console.warn('[useGenerate] RichText object validation failed, setting value anyway')
            setValue(result.object)
          }
        } else if ('name' in field) {
          setHistory(result.object[field.name])
          setValue(result.object[field.name])
        }
      } else {
        console.log('onFinish: result, field ', result, field)
      }
    },
    // schema: activeSchema as any,
  })

  // For richText fields, only expose object after completion to prevent streaming errors
  // This prevents Lexical from trying to parse incomplete states during streaming
  const safeObject = useMemo(() => {
    if (isRichTextField) {
      // For richText: only return object if streaming is complete
      // Return null during streaming to prevent any parsing attempts
      return richTextCompletedObject
    }
    // For other field types, return object normally (streaming is safe)
    return object
  }, [isRichTextField, richTextCompletedObject, object])

  useEffect(() => {
    if (!safeObject) {
      return
    }

    requestAnimationFrame(() => {
      // Skip useEffect for richText fields - handle them in onFinish instead
      // This prevents errors from incomplete streaming states
      if (field?.type === 'richText') {
        return
      }
      if (field && 'name' in field && safeObject[field.name]) {
        setValue(safeObject[field.name])
      }
    })
  }, [safeObject, editor, field, setValue])

  const streamObject = useCallback(
    ({ action = 'Compose', params }: ActionCallbackParams) => {
      // Reset completion state when starting new generation for richText fields
      if (isRichTextField) {
        setRichTextCompletedObject(null)
        setIsRichTextStreaming(true)
      }

      const doc = getData()

      const currentInstructionId = instructionIdRef.current

      const options = {
        action,
        actionParams: params,
        instructionId: currentInstructionId,
      }

      submit({
        allowedEditorNodes: Array.from(editor?._nodes?.keys() || []),
        doc: {
          ...doc,
          id: documentId,
        },
        locale: localFromContext?.code,
        options,
      })
    },
    [localFromContext?.code, instructionIdRef, documentId, isRichTextField, getData, submit, editor],
  )

  const generateUpload = useCallback(async () => {
    const doc = getData()
    const currentInstructionId = instructionIdRef.current

    return fetch(`${serverURL}${api}${PLUGIN_API_ENDPOINT_GENERATE_UPLOAD}`, {
      body: JSON.stringify({
        collectionSlug: collectionSlug ?? '',
        doc,
        documentId,
        locale: localFromContext?.code,
        options: {
          instructionId: currentInstructionId,
        },
      } satisfies Parameters<GenerateTextarea>[0]),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
      .then(async (uploadResponse) => {
        if (uploadResponse.ok) {
          const json = await uploadResponse.json()
          const { job, result } = json || {}
          if (result) {
            // Set the upload ID
            setValue(result?.id)
            setHistory(result?.id)

            // Show toast to prompt user to save
            toast.success('Image generated successfully! Click Save to see the preview.')

            return uploadResponse
          }

          // Async job: poll AI Jobs collection for status/progress/result_id
          if (job && job.id) {
            setIsJobActive(true)
            const cancelled = false
            let attempts = 0
            const maxAttempts = 600 // up to ~10 minutes @ 1s

            // Basic in-hook state via closure variables; UI will re-render off fetches below
            const poll = async (): Promise<void> => {
              if (cancelled) {
                return
              }
              try {
                const res = await fetch(
                  `${serverURL}${api}/${PLUGIN_AI_JOBS_TABLE}/${job.id}`,
                  { credentials: 'include' },
                )
                if (res.ok) {
                  const jobDoc = await res.json()
                  const { progress, result_id, status } = jobDoc || {}
                  setJobStatus(status)
                  setJobProgress(progress ?? 0)
                  // When result present, set field and finish
                  if (status === 'completed' && result_id) {
                    // Force upload field to refetch by clearing then setting the ID
                    setValue(null)
                    setTimeout(() => {
                      setValue(result_id)
                    }, 0)
                    setHistory(result_id)
                    setIsJobActive(false)
                    return
                  }
                  if (status === 'failed') {
                    setIsJobActive(false)
                    throw new Error('Video generation failed')
                  }
                }
              } catch (e) {
                // silent retry
              }

              attempts += 1
              if (!cancelled && attempts < maxAttempts) {
                setTimeout(poll, 1000)
              }
            }
            setTimeout(poll, 1000)
            return uploadResponse
          }

          throw new Error('generateUpload: Unexpected response')
        } else {
          const { errors = [] } = await uploadResponse.json()
          const errStr = errors.map((error: any) => error.message).join(', ')
          throw new Error(errStr)
        }
      })
      .catch((error) => {
        toast.error(`Failed to generate: ${error.message}`)
        console.error(
          'Error generating or setting your upload, please set it manually if its saved in your media files.',
          error,
        )
      })
  }, [getData, localFromContext?.code, instructionIdRef, setValue, documentId, collectionSlug, serverURL, api, setHistory])

  const generate = useCallback(
    async (options?: ActionCallbackParams) => {
      if ((field as any)?.type === 'upload') {
        return generateUpload()
      }
      // All supported types use structured object generation when schema is provided server-side
      return streamObject(options ?? { action: 'Compose' })
    },
    [generateUpload, streamObject, field],
  )

  const stop = useCallback(() => {
    console.log('Stopping...')
    objectStop()
    // Reset streaming state when stopped
    if (isRichTextField) {
      setIsRichTextStreaming(false)
    }
  }, [objectStop, isRichTextField])

  return {
    generate,
    isJobActive,
    isLoading: loadingObject,
    jobProgress,
    jobStatus,
    stop,
  }
}
