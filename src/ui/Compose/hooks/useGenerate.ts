import { experimental_useObject as useObject } from '@ai-sdk/react'
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { toast, useConfig, useDocumentInfo, useField, useForm, useLocale } from '@payloadcms/ui'
import { jsonSchema } from 'ai'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import type { ActionMenuItems, GenerateTextarea } from '../../../types.js'

import {
  PLUGIN_API_ENDPOINT_GENERATE,
  PLUGIN_API_ENDPOINT_GENERATE_UPLOAD,
  PLUGIN_INSTRUCTIONS_TABLE,
  PLUGIN_NAME,
} from '../../../defaults.js'
import { useFieldProps } from '../../../providers/FieldProvider/useFieldProps.js'
import { buildFieldJsonSchema } from '../../../utilities/buildFieldJsonSchema.js'
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

  const {
    type,
    description,
    fieldName,
    hasMany,
    maxRows,
    minRows,
    path: pathFromContext,
  } = useFieldProps()
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
    if (type === 'richText') {
      return memoizedSchema
    }
    // Build a minimal object schema for text/textarea (includes hasMany/min/max/description)
    const name = (fieldName as string) || 'value'
    let schemaJson: any
    try {
      if (type && (type === 'text' || type === 'textarea')) {
        schemaJson = buildFieldJsonSchema(
          {
            name,
            type: type as string,
            admin: { description },
            hasMany,
            maxRows,
            minRows,
          } as any,
          name,
        )
      }
    } catch (e) {
      console.error('Error building local field JSON schema', e)
    }

    if (!schemaJson) {
      schemaJson = {
        type: 'object',
        additionalProperties: false,
        properties: {
          [name]: hasMany ? { type: 'array', items: { type: 'string' } } : { type: 'string' },
        },
        required: [name],
      }
    }

    return jsonSchema(schemaJson)
  }, [type, memoizedSchema, fieldName, hasMany, minRows, maxRows, description])

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
        if (type === 'richText') {
          setHistory(result.object)
          setValue(result.object)
        } else {
          const key = fieldName as string
          const value =
            key && result.object && typeof result.object === 'object'
              ? (result.object as any)[key]
              : (result.object as any)
          setHistory(value)
          setValue(value)
        }
      } else {
        console.log('onFinish: result ', result)
      }
    },
    schema: activeSchema,
  })

  useEffect(() => {
    if (!object) {
      return
    }

    requestAnimationFrame(() => {
      if (type === 'richText') {
        // TODO: Temporary disabled pre validation, sometimes it fails to validate
        // const validateObject = await memoizedSchema?.validate?.(object)
        // if (validateObject?.success) {
        setSafeLexicalState(object, editor)
        // }
      }
    })
  }, [object, editor, type])

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
        toast.error(`Failed to generate: ${error.message}`)
        console.error(
          'Error generating or setting your upload, please set it manually if its saved in your media files.',
          error,
        )
      })
  }, [getData, localFromContext?.code, instructionIdRef, setValue, documentId, collectionSlug])

  const generate = useCallback(
    async (options?: ActionCallbackParams) => {
      if (type === 'upload') {
        return generateUpload()
      }
      // All supported text-like types (text, textarea, richText) use structured object generation
      return streamObject(options ?? { action: 'Compose' })
    },
    [generateUpload, streamObject, type],
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
