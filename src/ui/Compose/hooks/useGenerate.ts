import { experimental_useObject as useObject } from '@ai-sdk/react'
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { toast, useConfig, useDocumentInfo, useField, useForm, useLocale } from '@payloadcms/ui'
import { jsonSchema } from 'ai'
import { useCallback, useMemo, useRef } from 'react'

import type { ActionMenuItems } from '../../../types.js'

import { PLUGIN_API_ENDPOINT_GENERATE, PLUGIN_INSTRUCTIONS_TABLE, PLUGIN_NAME } from '../../../defaults.js'
import { useFieldProps } from '../../../providers/FieldProvider/useFieldProps.js'
import { editorSchemaValidator } from '../../../utilities/editorSchemaValidator.js'
import { fieldToJsonSchema } from '../../../utilities/fieldToJsonSchema.js'
import { setSafeLexicalState } from '../../../utilities/setSafeLexicalState.js'
import { useGenerateUpload } from './useGenerateUpload.js'
import { useHistory } from './useHistory.js'
import { useStreamingUpdate } from './useStreamingUpdate.js'

type ActionCallbackParams = { action: ActionMenuItems; params?: unknown }

export const useGenerate = ({ instructionId }: { instructionId: string }) => {
  const instructionIdRef = useRef(instructionId)
  // Sync ref
  instructionIdRef.current = instructionId

  const { field, path: pathFromContext } = useFieldProps()
  const { editor } = useEditorConfigContext()

  const { config } = useConfig()
  const { collections } = config

  // Use dispatchFields to update values without subscribing to them, avoiding re-renders during streaming
  // dispatchFields is handled inside useStreamingUpdate now, so we don't need it here
  // const { dispatchFields } = useForm()

  // Keep setValue for non-streaming updates (one-off), but do NOT destructure 'value' to avoid subscriptions
  const { setValue } = useField<any>({
    path: pathFromContext ?? '',
  })

  const { set: setHistory } = useHistory()
  const { getData } = useForm()
  const { id: documentId } = useDocumentInfo()
  const localFromContext = useLocale()

  // Editor Schema Setup
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
          // Set state directly to editor first for immediate feedback
          setSafeLexicalState(result.object, editor)

          // Update history
          setHistory(result.object)

          // Delay Payload's setValue slightly to ensure editor stability
          // and prevent field-level re-renders from interfering with the final state.
          setTimeout(() => {
            setValue(result.object)
          }, 150)
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

  // Hook 1: Handle high-frequency streaming updates
  useStreamingUpdate({
    editor,
    isLoading: loadingObject,
    object,
  })

  // Hook 2: Handle Upload generation and polling
  const { generateUpload, isJobActive, jobProgress, jobStatus } = useGenerateUpload({
    instructionIdRef,
    setValue,
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
