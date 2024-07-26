import type { LexicalEditor } from 'lexical'

import { useField, useFieldProps, useLocale } from '@payloadcms/ui'
import { useCompletion, experimental_useObject as useObject } from 'ai/react'
import { $getRoot } from 'lexical'
import { useCallback, useEffect } from 'react'

import type { GenerateTextarea, MenuItems } from '../types.js'

import { DocumentSchema } from '../ai/RichTextSchema.js'
import { useInstructions } from '../providers/InstructionsProvider/index.js'
import { useDotFields } from './useDotFields.js'

type UseGenerate = {
  lexicalEditor: LexicalEditor
}

export const useGenerate = ({ lexicalEditor }: UseGenerate) => {
  const { type, path: pathFromContext, schemaPath } = useFieldProps()

  //TODO: This should be dynamic, i think it was the part of component props but its not inside useFieldProps
  const relationTo = 'media'

  const { setValue } = useField<string>({
    path: pathFromContext,
  })

  const { id: instructionId } = useInstructions({
    path: schemaPath,
  })

  const localFromContext = useLocale()
  const { getDotFields } = useDotFields()

  const { object, submit } = useObject({
    api: '/api/ai/generate/textarea',
    onError: (error) => {
      console.error('Error generating object:', error)
    },
    schema: DocumentSchema,
  })

  const { complete, completion } = useCompletion({
    api: '/api/ai/generate/textarea',
    onError: (error) => {
      console.error('Error generating text:', error)
    },
    streamMode: 'stream-data',
  })

  useEffect(() => {
    if (!object) return

    // TODO: Improve error handling
    requestAnimationFrame(() => {
      try {
        const editorState = lexicalEditor.parseEditorState(JSON.stringify(object))
        if (editorState.isEmpty()) return

        lexicalEditor.update(
          () => {
            const root = $getRoot()
            root.clear() //TODO: this is hack to prevent reconciliation error - find a way
            lexicalEditor.setEditorState(editorState)
          },
          {
            discrete: true,
          },
        )
      } catch (e) {
        // setValue(object) //TODO: This breaks the editor find a better way to handle objects that are not valid
      }
    })
  }, [object])

  useEffect(() => {
    if (!completion) return

    requestAnimationFrame(() => {
      setValue(completion)
    })
  }, [completion])

  const streamObject = useCallback(
    ({ action = 'Compose' }: { action: MenuItems }) => {
      const { fields = {} } = getDotFields()
      const options = {
        action,
        instructionId,
      }

      submit({
        doc: fields,
        locale: localFromContext?.code,
        options,
      })
    },
    [getDotFields, localFromContext?.code, instructionId],
  )

  const streamText = useCallback(
    async ({ action = 'Compose' }: { action: MenuItems }) => {
      const { fields = {} } = getDotFields()
      const options = {
        action,
        instructionId,
      }

      await complete('', {
        body: {
          doc: fields,
          locale: localFromContext?.code,
          options,
        },
      })
    },
    [getDotFields, localFromContext?.code, instructionId],
  )

  const generateUpload = useCallback(async () => {
    const { fields = {} } = getDotFields()
    if (!Object.keys(fields).length) {
      console.log('dotFields is empty')
      return
    }

    return fetch('/api/ai/generate/upload', {
      body: JSON.stringify({
        doc: fields,
        locale: localFromContext?.code,
        options: {
          instructionId,
          uploadCollectionSlug: relationTo,
        },
      } satisfies Parameters<GenerateTextarea>[0]),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
      .then(async (generatedImageResponse) => {
        if (generatedImageResponse.ok) {
          const { result: generatedImage } = await generatedImageResponse.json()
          setValue(generatedImage?.id)
        } else {
          const { errors = [] } = await generatedImageResponse.json()
          const errStr = errors.map((error) => error.message).join(', ')
          throw new Error(errStr)
        }
        return generatedImageResponse
      })
      .catch((error) => {
        console.error('Error generating image', error)
      })
  }, [getDotFields, localFromContext?.code, instructionId, relationTo, setValue])

  return useCallback(
    async (options?: { action: MenuItems }) => {
      if (type === 'richText') {
        return streamObject(options)
      }

      if (['text', 'textarea'].includes(type)) {
        return streamText(options)
      }
      if (type === 'upload') {
        return generateUpload()
      }
    },
    [generateUpload, streamObject, streamText, type],
  )
}
