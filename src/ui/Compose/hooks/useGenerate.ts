import { experimental_useObject as useObject } from '@ai-sdk/react'
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import {
  toast,
  useConfig,
  useDocumentInfo,
  useField,
  useForm,
  useLocale,
  useTranslation,
} from '@payloadcms/ui'
import { jsonSchema } from 'ai'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import type { PluginAITranslationKeys, PluginAITranslations } from '../../../translations/index.js'
import type { ActionMenuItems, GenerateTextarea } from '../../../types.js'

import {
  PLUGIN_API_ENDPOINT_GENERATE,
  PLUGIN_API_ENDPOINT_GENERATE_UPLOAD,
  PLUGIN_INSTRUCTIONS_TABLE,
  PLUGIN_NAME,
} from '../../../defaults.js'
import { useFieldProps } from '../../../providers/FieldProvider/useFieldProps.js'
import { editorSchemaValidator } from '../../../utilities/editorSchemaValidator.js'
import { fieldToJsonSchema } from '../../../utilities/fieldToJsonSchema.js'
import {
  normalizeLexicalState,
  setSafeLexicalState,
} from '../../../utilities/setSafeLexicalState.js'
import { useHistory } from './useHistory.js'

type ActionCallbackParams = { action: ActionMenuItems; params?: unknown }

export const useGenerate = ({ instructionId }: { instructionId: string }) => {
  // Create a ref to hold the current instructionId
  const instructionIdRef = useRef(instructionId)

  // `setSafeLexicalState` reinserts preserved custom blocks by comparing against a snapshot of
  // "current" editor state. Streaming generation calls `setSafeLexicalState` repeatedly (on
  // every partial object and again on finish), each of which commits a new editor state - so
  // deriving that snapshot from the live editor state at call time means an early call (with
  // only a small partial object) computes and commits a block placement, and every later call
  // in the same cycle then treats that already-shifted placement as "original", compounding.
  // Capture the pre-generation snapshot exactly once, before submit() fires, and reuse it for
  // every setSafeLexicalState call in that generation cycle.
  const originalRootRef = useRef<null | Record<string, unknown>>(null)

  // Update the ref whenever instructionId changes
  useEffect(() => {
    instructionIdRef.current = instructionId
  }, [instructionId])

  const { field, path: pathFromContext } = useFieldProps()
  const { t } = useTranslation<PluginAITranslations, PluginAITranslationKeys>()
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
    api: `${api}${PLUGIN_API_ENDPOINT_GENERATE}`,
    onError: (error: any) => {
      toast.error(t('ai-plugin:failedToGenerate', { message: error.message }))
      console.error('Error generating object:', error)
    },
    onFinish: (result) => {
      if (result.object && field) {
        if (field.type === 'richText') {
          const normalizedObject = normalizeLexicalState(result.object)
          const didUpdateEditor = setSafeLexicalState(result.object, editor, {
            originalRoot: originalRootRef.current,
          })
          setHistory(normalizedObject ?? result.object)
          if (didUpdateEditor && normalizedObject) {
            setValue(normalizedObject)
          } else {
            toast.error(t('ai-plugin:richTextApplyFailed'))
          }
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
        const normalizedObject = normalizeLexicalState(object)
        const didUpdateEditor = setSafeLexicalState(object, editor, {
          logErrors: false,
          originalRoot: originalRootRef.current,
        })
        if (didUpdateEditor && normalizedObject) {
          setValue(normalizedObject)
        }
      } else if (field && 'name' in field && object[field.name]) {
        setValue(object[field.name])
      }
    })
  }, [object, editor, field, setValue])

  const streamObject = useCallback(
    ({ action = 'Compose', params }: ActionCallbackParams) => {
      const doc = getData()

      const currentInstructionId = instructionIdRef.current

      const options = {
        action,
        actionParams: params,
        instructionId: currentInstructionId,
      }

      // Snapshot the editor state exactly once, before any streamed updates can mutate it.
      originalRootRef.current = editor?.getEditorState
        ? ((editor.getEditorState().toJSON()?.root as Record<string, unknown>) ?? null)
        : null

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
    [localFromContext?.code, instructionIdRef, documentId, editor],
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
          const { result } = await uploadResponse.json()
          if (!result) {
            throw new Error('generateUpload: Something went wrong')
          }

          setValue(result?.id)
          setHistory(result?.id)
          console.log('Image updated...', result)
        } else {
          const { errors = [] } = await uploadResponse.json()
          const errStr = errors.map((error: any) => error.message).join(', ')
          throw new Error(errStr)
        }
        return uploadResponse
      })
      .catch((error) => {
        toast.error(t('ai-plugin:failedToGenerate', { message: error.message }))
        console.error(
          'Error generating or setting your upload, please set it manually if its saved in your media files.',
          error,
        )
      })
  }, [getData, localFromContext?.code, instructionIdRef, setValue, documentId, collectionSlug, t])

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
    isLoading: loadingObject,
    stop,
  }
}
