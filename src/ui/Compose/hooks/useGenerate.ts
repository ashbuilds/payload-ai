import { useCompletion, experimental_useObject as useObject } from '@ai-sdk/react'
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { toast, useConfig, useDocumentInfo, useField, useForm, useLocale } from '@payloadcms/ui'
import { jsonSchema } from 'ai'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { ActionMenuItems, GenerateTextarea } from '../../../types.js'

import {
  PLUGIN_API_ENDPOINT_GENERATE,
  PLUGIN_API_ENDPOINT_GENERATE_UPLOAD,
  PLUGIN_INSTRUCTIONS_TABLE,
  PLUGIN_AI_JOBS_TABLE,
  PLUGIN_NAME,
} from '../../../defaults.js'
import { useFieldProps } from '../../../providers/FieldProvider/useFieldProps.js'
import { editorSchemaValidator } from '../../../utilities/editorSchemaValidator.js'
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

  const { type, path: pathFromContext } = useFieldProps()
  const editorConfigContext = useEditorConfigContext()

  const { editor } = editorConfigContext

  const { config } = useConfig()
  const {
    routes: { api },
    serverURL,
  } = config

  const { setValue } = useField<string>({
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
      if (result.object) {
        setHistory(result.object)
        setValue(result.object)
      } else {
        console.log('onFinish: result ', result)
      }
    },
    schema: memoizedSchema,
  })

  useEffect(() => {
    if (!object) {
      return
    }

    requestAnimationFrame(() => {
      // TODO: Temporary disabled pre validation, sometimes it fails to validate
      // const validateObject = await memoizedSchema?.validate?.(object)
      // if (validateObject?.success) {
      setSafeLexicalState(object, editor)
      // }
    })
  }, [object, editor])

  const {
    complete,
    completion,
    isLoading: loadingCompletion,
    stop: completionStop,
  } = useCompletion({
    api: `${serverURL}${api}${PLUGIN_API_ENDPOINT_GENERATE}`,
    onError: (error: any) => {
      toast.error(`Failed to generate: ${error.message}`)
      console.error('Error generating text:', error)
    },
    onFinish: (prompt, result) => {
      setHistory(result)
    },
    streamProtocol: 'data',
  })

  useEffect(() => {
    if (!completion) {
      return
    }

    requestAnimationFrame(() => {
      setValue(completion)
    })
  }, [completion])

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

  const streamText = useCallback(
    async ({ action = 'Compose', params }: ActionCallbackParams) => {
      const doc = getData()
      const currentInstructionId = instructionIdRef.current

      const options = {
        action,
        actionParams: params,
        instructionId: currentInstructionId,
      }

      await complete('', {
        body: {
          doc: {
            ...doc,
            id: documentId,
          },
          locale: localFromContext?.code,
          options,
        },
      })
    },
    [getData, localFromContext?.code, instructionIdRef, complete, documentId],
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
            setValue(result?.id)
            setHistory(result?.id)
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
                    setValue(result_id)
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
      if (type === 'richText') {
        return streamObject(options ?? { action: 'Compose' })
      }

      if (['text', 'textarea'].includes(type ?? '') && type) {
        return streamText(options ?? { action: 'Compose' })
      }

      if (type === 'upload') {
        return generateUpload()
      }
    },
    [generateUpload, streamObject, streamText, type],
  )

  const stop = useCallback(() => {
    console.log('Stopping...')
    objectStop()
    completionStop()
  }, [objectStop, completionStop])

  return {
    generate,
    isJobActive,
    isLoading: loadingCompletion || loadingObject,
    jobProgress,
    jobStatus,
    stop,
  }
}
