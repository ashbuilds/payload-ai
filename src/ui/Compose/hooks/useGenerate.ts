import { useCompletion } from '@ai-sdk/react'
import { convertMarkdownToLexical } from '@payloadcms/richtext-lexical'
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { toast, useConfig, useDocumentInfo, useField, useForm, useLocale } from '@payloadcms/ui'
import { useCallback, useEffect, useRef } from 'react'

import type { ActionMenuItems, GenerateTextarea } from '../../../types.js'

import {
  PLUGIN_API_ENDPOINT_GENERATE,
  PLUGIN_API_ENDPOINT_GENERATE_UPLOAD,
} from '../../../defaults.js'
import { useFieldProps } from '../../../providers/FieldProvider/useFieldProps.js'
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

  const { editor, editorConfig } = editorConfigContext

  const { config } = useConfig()
  const {
    routes: { api },
    serverURL,
  } = config

  const { setValue } = useField<string>({
    path: pathFromContext ?? '',
  })

  const { set: setHistory } = useHistory()

  const { getData } = useForm()
  const { id: documentId, collectionSlug } = useDocumentInfo()

  const localFromContext = useLocale()

  // For rich text fields - generates markdown and converts to Lexical
  const {
    complete: completeRichText,
    completion: richTextCompletion,
    isLoading: loadingRichText,
    stop: stopRichText,
  } = useCompletion({
    api: `${serverURL}${api}${PLUGIN_API_ENDPOINT_GENERATE}`,
    onError: (error: any) => {
      toast.error(`Failed to generate: ${error.message}`)
      console.error('Error generating rich text:', error)
    },
    onFinish: async (_prompt: any, result: any) => {
      // Convert markdown to Lexical JSON
      const lexicalJSON = await convertMarkdownToLexical({
        editorConfig: editorConfig as any,
        markdown: result,
      })
      setHistory(lexicalJSON)
      setValue(lexicalJSON)
    },
    streamProtocol: 'data',
  })

  // Apply markdown to Lexical conversion during streaming
  useEffect(() => {
    if (!richTextCompletion || !editor || !editorConfig) {
      return
    }

    requestAnimationFrame(async () => {
      try {
        // Convert the current markdown to Lexical JSON
        const lexicalJSON = await convertMarkdownToLexical({
          editorConfig: editorConfig as any,
          markdown: richTextCompletion,
        })
        setSafeLexicalState(lexicalJSON, editor)
      } catch (error) {
        console.error('Error converting markdown to Lexical:', error)
      }
    })
  }, [richTextCompletion, editor, editorConfig])

  // For plain text/textarea fields
  const {
    complete: completeText,
    completion: textCompletion,
    isLoading: loadingText,
    stop: stopText,
  } = useCompletion({
    api: `${serverURL}${api}${PLUGIN_API_ENDPOINT_GENERATE}`,
    onError: (error: any) => {
      toast.error(`Failed to generate: ${error.message}`)
      console.error('Error generating text:', error)
    },
    onFinish: (_prompt: any, result: any) => {
      setHistory(result)
    },
    streamProtocol: 'data',
  })

  useEffect(() => {
    if (!textCompletion) {
      return
    }

    requestAnimationFrame(() => {
      setValue(textCompletion)
    })
  }, [textCompletion])

  const streamRichText = useCallback(
    async ({ action = 'Compose', params }: ActionCallbackParams) => {
      const doc = getData()
      const currentInstructionId = instructionIdRef.current

      const options = {
        action,
        actionParams: params,
        instructionId: currentInstructionId,
      }

      await completeRichText('', {
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
    [getData, localFromContext?.code, instructionIdRef, completeRichText, documentId],
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

      await completeText('', {
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
    [getData, localFromContext?.code, instructionIdRef, completeText, documentId],
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
          error
        )
      })
  }, [getData, localFromContext?.code, instructionIdRef, setValue, documentId, collectionSlug])

  const generate = useCallback(
    async (options?: ActionCallbackParams) => {
      if (type === 'richText') {
        return streamRichText(options ?? { action: 'Compose' })
      }

      if (['text', 'textarea'].includes(type ?? '') && type) {
        return streamText(options ?? { action: 'Compose' })
      }

      if (type === 'upload') {
        return generateUpload()
      }
    },
    [generateUpload, streamRichText, streamText, type],
  )

  const stop = useCallback(() => {
    console.log('Stopping...')
    stopRichText()
    stopText()
  }, [stopRichText, stopText])

  return {
    generate,
    isLoading: loadingText || loadingRichText,
    stop,
  }
}
