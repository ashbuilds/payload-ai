import { toast, useConfig, useDocumentInfo, useForm, useLocale } from '@payloadcms/ui'
import { useCallback, useState } from 'react'

import type { GenerateTextarea } from '../../../types.js'

import { PLUGIN_AI_JOBS_TABLE, PLUGIN_API_ENDPOINT_GENERATE_UPLOAD } from '../../../defaults.js'
import { useHistory } from './useHistory.js'

type UseGenerateUploadParams = {
  instructionIdRef: React.MutableRefObject<string>
  setValue: (value: any) => void
}

export const useGenerateUpload = ({ instructionIdRef, setValue }: UseGenerateUploadParams) => {
  const { config } = useConfig()
  const {
    routes: { api },
    serverURL,
  } = config
  const { id: documentId, collectionSlug } = useDocumentInfo()
  const localFromContext = useLocale()
  const { getData } = useForm()
  const { set: setHistory } = useHistory()

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
  }, [
    getData,
    localFromContext?.code,
    instructionIdRef,
    setValue,
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
