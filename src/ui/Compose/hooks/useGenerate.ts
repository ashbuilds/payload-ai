import type { LexicalEditor } from 'lexical'

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
  PLUGIN_TRUNCATED_MARKER,
} from '../../../defaults.js'
import { useFieldProps } from '../../../providers/FieldProvider/useFieldProps.js'
import { editorSchemaValidator } from '../../../utilities/editorSchemaValidator.js'
import { fieldToJsonSchema } from '../../../utilities/fieldToJsonSchema.js'
import { repairTruncatedLexicalResult } from '../../../utilities/repairTruncatedLexicalResult.js'
import {
  sanitizeLexicalState,
  setSafeLexicalState,
} from '../../../utilities/setSafeLexicalState.js'
import { useHistory } from './useHistory.js'

/**
 * What the editor actually holds after an apply, which is what has to be persisted: the applied
 * state also carries the preserved blocks, and a generated object never knows about those.
 * Persisting the object instead would drop every preserved block from the saved document.
 */
const appliedEditorState = (editorInstance: LexicalEditor | null | undefined) =>
  editorInstance?.getEditorState?.().toJSON() ?? null

type ActionCallbackParams = { action: ActionMenuItems; params?: unknown }

/**
 * Minimum distance between two streamed richText applies. Every apply parses the partial object
 * and reconciles the whole document, so following the model's chunk rate (~17/s for a long
 * Translate) spends almost all of that work on intermediate states nobody gets to read.
 */
const STREAM_APPLY_MIN_INTERVAL_MS = 200

/**
 * How long a warning about an incomplete result stays up. The default of four seconds is meant for
 * confirmations, not for a message that names a setting the user is supposed to act on.
 */
const WARNING_TOAST_DURATION_MS = 15000

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

  // A throw inside Lexical's reconciler leaves the editor instance unable to render any further
  // state, so once one apply has thrown, every following streamed apply fails identically. Stop
  // applying for the rest of the cycle instead of repeating the same failed reconcile.
  const applyBrokenRef = useRef(false)

  // Set when the final object only passed validation after unusable nodes were dropped, which
  // means the model stopped mid-node - the content is applied, but it is not the whole answer.
  const resultRepairedRef = useRef(false)

  // Set when the endpoint reported that the model stopped at its output token limit. Unlike the
  // repair above this is the model's own reason, so it also catches a result that got cut off at a
  // point where it still happens to validate.
  const truncatedRef = useRef(false)

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
          if (memoizedValidator(value)) {
            return {
              success: true,
              value,
            }
          }

          // A generation that runs into the model's output token limit stops mid-node, and that
          // single unusable node invalidates the entire result - the SDK then hands `onFinish` no
          // object at all and a finished translation is thrown away. Keep the part that validates;
          // the caller reports the repair.
          const repairedValue = repairTruncatedLexicalResult(value, memoizedValidator)

          if (repairedValue) {
            resultRepairedRef.current = true

            return {
              success: true,
              value: repairedValue,
            }
          }

          return {
            error: new Error('Invalid schema'),
            success: false,
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

  const latestObjectRef = useRef<unknown>(null)
  const applyTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null)
  const applyFrameRef = useRef<null | number>(null)
  const lastAppliedAtRef = useRef(0)
  const finishedRef = useRef(false)

  const cancelPendingApply = useCallback(() => {
    if (applyTimeoutRef.current !== null) {
      clearTimeout(applyTimeoutRef.current)
      applyTimeoutRef.current = null
    }
    if (applyFrameRef.current !== null) {
      cancelAnimationFrame(applyFrameRef.current)
      applyFrameRef.current = null
    }
  }, [])

  const applyStreamedRichText = useCallback(() => {
    const streamedObject = latestObjectRef.current

    if (!streamedObject || applyBrokenRef.current || finishedRef.current) {
      return
    }

    // A partial object regularly has no usable `root.children` yet; that is an expected stage of
    // the stream, not an error, so it is skipped before it can be logged as one.
    const sanitizedObject = sanitizeLexicalState(streamedObject, editor)

    if (!sanitizedObject) {
      return
    }

    const didUpdateEditor = setSafeLexicalState(sanitizedObject, editor, {
      logErrors: false,
      onApplyError: (error) => {
        applyBrokenRef.current = true
        // Logged once per cycle: further applies are skipped, so this cannot flood.
        console.error('Error setting editor state while streaming: ', error)
      },
      originalRoot: originalRootRef.current,
      skipScrollIntoView: true,
    })

    if (didUpdateEditor) {
      setValue(appliedEditorState(editor) ?? sanitizedObject)
    }
  }, [editor, setValue])

  const scheduleStreamApply = useCallback(() => {
    if (applyBrokenRef.current || finishedRef.current) {
      return
    }

    // Already scheduled: newer objects only replace `latestObjectRef`, they never queue another
    // apply - that is what turns the chunk rate into a fixed maximum rate.
    if (applyTimeoutRef.current !== null || applyFrameRef.current !== null) {
      return
    }

    const sinceLastApply = Date.now() - lastAppliedAtRef.current

    applyTimeoutRef.current = setTimeout(
      () => {
        applyTimeoutRef.current = null
        // The frame keeps the parse and reconcile out of React's commit phase.
        applyFrameRef.current = requestAnimationFrame(() => {
          applyFrameRef.current = null
          lastAppliedAtRef.current = Date.now()
          applyStreamedRichText()
        })
      },
      Math.max(0, STREAM_APPLY_MIN_INTERVAL_MS - sinceLastApply),
    )
  }, [applyStreamedRichText])

  /**
   * Removes the marker the endpoint appends when the model stopped at its output token limit. The
   * SDK parses the stream as JSON and must never see the marker, so it is taken out here - this is
   * the only place that sits between the response and the hook.
   *
   * The filter works on raw bytes: the marker is a single byte in UTF-8, and a byte that low can
   * never be part of a multi-byte character, so no chunk boundary can hide it and nothing needs to
   * be decoded to find it.
   */
  const fetchWithoutTruncationMarker = useCallback<typeof globalThis.fetch>(async (input, init) => {
    const response = await fetch(input, init)

    if (!response.body) {
      return response
    }

    const markerByte = PLUGIN_TRUNCATED_MARKER.charCodeAt(0)

    const body = response.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          const markerAt = chunk.indexOf(markerByte)

          if (markerAt === -1) {
            controller.enqueue(chunk)

            return
          }

          truncatedRef.current = true

          if (markerAt > 0) {
            controller.enqueue(chunk.subarray(0, markerAt))
          }
        },
      }),
    )

    return new Response(body, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    })
  }, [])

  const {
    isLoading: loadingObject,
    object,
    stop: objectStop,
    submit,
  } = useObject<any, Record<string, unknown>>({
    api: `${api}${PLUGIN_API_ENDPOINT_GENERATE}`,
    fetch: fetchWithoutTruncationMarker,
    onError: (error: any) => {
      finishedRef.current = true
      cancelPendingApply()
      toast.error(t('ai-plugin:failedToGenerate', { message: error.message }))
      console.error('Error generating object:', error)
    },
    onFinish: (result) => {
      // A throttled apply may still be pending; without this it would land after the final state
      // and put a partial back into the editor.
      finishedRef.current = true
      cancelPendingApply()

      if (result.object && field) {
        if (field.type === 'richText') {
          const sanitizedObject = sanitizeLexicalState(result.object, editor)
          const didUpdateEditor = setSafeLexicalState(result.object, editor, {
            originalRoot: originalRootRef.current,
          })
          // A failed apply means this editor instance can no longer reconcile - a display problem,
          // not a data problem. Persisting the result regardless is the difference between saving
          // the full generation and keeping whatever partial state was applied last.
          const persistedState =
            (didUpdateEditor ? appliedEditorState(editor) : null) ?? sanitizedObject

          setHistory(sanitizedObject ?? result.object)

          if (persistedState) {
            setValue(persistedState)
          }
          if (!didUpdateEditor) {
            toast.error(t('ai-plugin:richTextApplyFailed'))
          }
        } else if ('name' in field) {
          setHistory(result.object[field.name])
          setValue(result.object[field.name])
        }

        // Reported for every field type: stopping early is a property of the generation, not of
        // the editor, and the result is applied either way - the user has to know it is partial.
        // The token limit is called out separately because that is the one cause the user can fix.
        if (truncatedRef.current) {
          toast.warning(t('ai-plugin:resultTokenLimit'), { duration: WARNING_TOAST_DURATION_MS })
        } else if (resultRepairedRef.current) {
          toast.warning(t('ai-plugin:resultIncomplete'), { duration: WARNING_TOAST_DURATION_MS })
        }
      } else {
        // No object means the final result did not match the schema (`result.error` is then a
        // TypeValidationError): nothing was applied and nothing persisted, so without this the
        // generation would end without any feedback at all.
        toast.error(
          t('ai-plugin:failedToGenerate', { message: result.error?.message ?? 'no result object' }),
        )
        console.error('onFinish: no usable object ', result, field)
      }
    },
    schema: activeSchema as any,
  })

  useEffect(() => {
    if (!object) {
      return
    }

    if (field?.type === 'richText') {
      latestObjectRef.current = object
      scheduleStreamApply()
      return
    }

    requestAnimationFrame(() => {
      if (field && 'name' in field && object[field.name]) {
        setValue(object[field.name])
      }
    })
  }, [object, field, scheduleStreamApply, setValue])

  // Unmount only: tying this cleanup to `object` would cancel the pending apply on every chunk
  // and there would be no throttling left.
  useEffect(() => {
    return () => {
      cancelPendingApply()
    }
  }, [cancelPendingApply])

  const streamObject = useCallback(
    ({ action = 'Compose', params }: ActionCallbackParams) => {
      const doc = getData()

      const currentInstructionId = instructionIdRef.current

      const options = {
        action,
        actionParams: params,
        instructionId: currentInstructionId,
      }

      cancelPendingApply()
      applyBrokenRef.current = false
      finishedRef.current = false
      resultRepairedRef.current = false
      truncatedRef.current = false
      latestObjectRef.current = null
      lastAppliedAtRef.current = 0

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
    [localFromContext?.code, instructionIdRef, documentId, editor, cancelPendingApply],
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
    cancelPendingApply()
    objectStop()
  }, [cancelPendingApply, objectStop])

  return {
    generate,
    isLoading: loadingObject,
    stop,
  }
}
