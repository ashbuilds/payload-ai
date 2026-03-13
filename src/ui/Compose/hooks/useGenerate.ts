import { experimental_useObject as useObject } from '@ai-sdk/react'
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { toast, useDocumentInfo, useField, useForm, useLocale } from '@payloadcms/ui'
import { jsonSchema } from 'ai'
import { useCallback, useEffect, useRef } from 'react'

import type { ActionMenuItems } from '../../../types.js'

import { PLUGIN_API_ENDPOINT_GENERATE } from '../../../defaults.js'
import { useFieldProps } from '../../../providers/FieldProvider/useFieldProps.js'
import { useInstructions } from '../../../providers/InstructionsProvider/useInstructions.js'
import { setSafeLexicalState } from '../../../utilities/lexical/setSafeLexicalState.js'
import { mergeGeneratedValue } from './mergeGeneratedValue.js'
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

  const { field, path: pathFromContext, schemaPath } = useFieldProps()
  const { appendGenerated } = useInstructions({ schemaPath })
  const editorConfigContext = useEditorConfigContext()
  const { setValue, value: currentFieldValue } = useField<any>({
    path: pathFromContext ?? '',
  })
  const appendGeneratedRef = useRef(!!appendGenerated)
  const currentFieldValueRef = useRef(currentFieldValue)
  const { set: setHistory } = useHistory()
  const { getData } = useForm()
  const { id: documentId } = useDocumentInfo()
  const locale = useLocale()

  useEffect(() => {
    appendGeneratedRef.current = !!appendGenerated
  }, [appendGenerated])

  useEffect(() => {
    currentFieldValueRef.current = currentFieldValue
  }, [currentFieldValue])

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
        } else if ('name' in field && result.object[field.name] !== undefined) {
          const merged = mergeGeneratedValue({
            appendGenerated: appendGeneratedRef.current,
            currentValue: currentFieldValueRef.current,
            generatedValue: result.object[field.name],
            hasMany: (field as any).hasMany === true,
            max: typeof (field as any).max === 'number' ? (field as any).max : undefined,
            maxRows: typeof (field as any).maxRows === 'number' ? (field as any).maxRows : undefined,
          })

          if (merged.truncated) {
            toast.info('Appended values were truncated to this field maximum.')
          }

          setHistory(merged.value)
          setValue(merged.value)
        }
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
        fieldPath: pathFromContext ?? '',
        locale: locale?.code,
        options,
      })
    },
    [locale?.code, instructionIdRef, documentId, getData, submit, editor],
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
