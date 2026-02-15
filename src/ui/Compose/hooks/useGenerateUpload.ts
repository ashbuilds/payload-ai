import { toast, useConfig, useDocumentInfo, useField, useForm, useLocale } from '@payloadcms/ui'
import { type RefObject, useCallback, useState } from 'react'

import type { GenerateTextarea } from '../../../types.js'

import { PLUGIN_AI_JOBS_TABLE, PLUGIN_API_ENDPOINT_GENERATE_UPLOAD } from '../../../defaults.js'
import { useFieldProps } from '../../../providers/FieldProvider/useFieldProps.js'
import { useHistory } from './useHistory.js'

type UseGenerateUploadParams = {
  instructionIdRef: RefObject<string>
}

export const useGenerateUpload = ({ instructionIdRef }: UseGenerateUploadParams) => {
  const { config } = useConfig()
  const {
    routes: { api },
    serverURL,
  } = config
  const { id: documentId, collectionSlug } = useDocumentInfo()
  const localFromContext = useLocale()
  const { getData } = useForm()
  const { set: setHistory } = useHistory()

  const { field, path: pathFromContext } = useFieldProps()
  const { setValue } = useField<any>({
    path: pathFromContext ?? '',
  })

  // Async job UI state
  const [jobStatus, setJobStatus] = useState<string | undefined>(undefined)
  const [jobProgress, setJobProgress] = useState<number>(0)
  const [isJobActive, setIsJobActive] = useState<boolean>(false)

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
            if (Array.isArray(result)) {
              const ids = result.map((r: any) => r.id)
              setValue(ids)
              setHistory(ids)
            } else {
              setValue(result?.id)
              setHistory(result?.id)
            }

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
                const res = await fetch(`${serverURL}${api}/${PLUGIN_AI_JOBS_TABLE}/${job.id}`, {
                  credentials: 'include',
                })
                if (res.ok) {
                  const jobDoc = await res.json()
                  const { progress, result_id, status } = jobDoc || {}
                  setJobStatus(status)
                  setJobProgress(progress ?? 0)
                  // When result present, set field and finish
                  if (status === 'completed' && result_id) {
                    let valueToSet = result_id

                    // Attempt to fetch full document for immediate preview
                    if (field && 'relationTo' in field && typeof field.relationTo === 'string') {
                      let attempts = 0
                      const maxAttempts = 3
                      while (attempts < maxAttempts) {
                        try {
                          const docRes = await fetch(
                            `${serverURL}${api}/${field.relationTo}/${result_id}`,
                            {
                              credentials: 'include',
                            },
                          )
                          if (docRes.ok) {
                            const doc = await docRes.json()
                            // Verify we have a URL for preview
                            if (doc && doc.url) {
                              valueToSet = doc
                              break
                            }
                          }
                        } catch (e) {
                          console.error('Failed to fetch generated document for preview:', e)
                        }
                        attempts++
                        if (attempts < maxAttempts) {
                          await new Promise((resolve) => setTimeout(resolve, 500))
                        }
                      }
                    }

                    setValue(valueToSet)
                    setHistory(result_id)
                    setIsJobActive(false)
                    return
                  }
                  if (status === 'failed') {
                    setIsJobActive(false)
                    throw new Error('Video generation failed')
                  }
                }
              } catch (_) {
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
  }, [
    getData,
    localFromContext?.code,
    instructionIdRef,
    // setValue,
    documentId,
    collectionSlug,
    serverURL,
    api,
    setHistory,
  ])

  return {
    generateUpload,
    isJobActive,
    jobProgress,
    jobStatus,
  }
}
