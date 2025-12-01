import { experimental_useObject as useObject } from '@ai-sdk/react'
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { toast, useConfig, useDocumentInfo, useField, useForm, useLocale } from '@payloadcms/ui'
import { jsonSchema } from 'ai'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ActionMenuItems, GenerateTextarea } from '../../../types.js'

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

  const { getData } = useForm()
  const { id: documentId, collectionSlug } = useDocumentInfo()

  const localFromContext = useLocale()
  const {
    config: { collections },
  } = useConfig()

  const collection = collections.find((collection) => collection.slug === PLUGIN_INSTRUCTIONS_TABLE)
  const { custom: { [PLUGIN_NAME]: { editorConfig = {} } = {} } = {} } = collection?.admin ?? {}
  const { schema: editorSchema = {} } = editorConfig

  const memoizedValidator = useMemo(() => {
    return editorSchemaValidator(editorSchema)
  }, [editorSchema])

  const memoizedSchema = useMemo(
    () =>
      jsonSchema(editorSchema, {
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
    [memoizedValidator],
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
    },
    onFinish: (result) => {
      if (result.object && field) {
        if (field.type === 'richText') {
          setHistory(result.object)
          setValue(result.object)
        } else if ('name' in field) {
          setHistory(result.object[field.name])
          setValue(result.object[field.name])
        }
      } else {
        console.log('onFinish: result, field ', result, field)
      }
    },
    schema: activeSchema as any,
  })

  useEffect(() => {
    if (!object) {
      return
    }

    requestAnimationFrame(() => {
      if (field?.type === 'richText') {
      setSafeLexicalState(object, editor)
      } else if (field && 'name' in field && object[field.name]) {
        setValue(object[field.name])
      }
    })
  }, [object, editor, field])

  const streamObject = useCallback(
    ({ action = 'Compose', params }: ActionCallbackParams) => {
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
    [localFromContext?.code, instructionIdRef, documentId],
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
  }, [getData, localFromContext?.code, instructionIdRef, setValue, documentId, collectionSlug])

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
  }, [objectStop])

  return {
    generate,
    isJobActive,
    isLoading: loadingObject,
    jobProgress,
    jobStatus,
    stop,
  }
}
