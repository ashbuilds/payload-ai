import { experimental_useObject as useObject } from '@ai-sdk/react'
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { toast, useDocumentInfo, useField, useForm, useLocale } from '@payloadcms/ui'
import { jsonSchema } from 'ai'
import { useCallback, useEffect, useRef } from 'react'

import type { ActionMenuItems } from '../../../types.js'

import { PLUGIN_API_ENDPOINT_GENERATE } from '../../../defaults.js'
import { useFieldProps } from '../../../providers/FieldProvider/useFieldProps.js'
import { setSafeLexicalState } from '../../../utilities/setSafeLexicalState.js'
import { useGenerateUpload } from './useGenerateUpload.js'
import { useHistory } from './useHistory.js'
import { useStreamingUpdate } from './useStreamingUpdate.js'

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
  const { setValue } = useField<any>({
    path: pathFromContext ?? '',
  })
  const { set: setHistory } = useHistory()
  const { getData } = useForm()
  const { id: documentId } = useDocumentInfo()
  const localFromContext = useLocale()

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
          setSafeLexicalState(result.object, editor)
        } else if ('name' in field && result.object[field.name]) {
          setHistory(result.object[field.name])
          setValue(result.object[field.name])
        }
      } else {
        console.log('onFinish: result, field ', result, field)
      }
    },
    schema: jsonSchema({
      type: 'object',
      additionalProperties: true,
      properties: {},
    }) as any,
  })

  const { editor } = editorConfigContext

  // Hook: Handle high-frequency streaming updates
  useStreamingUpdate({
    editor,
    isLoading: loadingObject,
    object,
  })

  // Hook 2: Handle Upload generation and polling
  const { generateUpload, isJobActive, jobProgress, jobStatus } = useGenerateUpload({
    instructionIdRef,
  })

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
    [localFromContext?.code, instructionIdRef, documentId, getData, submit, editor],
  )

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
