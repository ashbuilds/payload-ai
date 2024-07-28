import type { LexicalEditor } from 'lexical'

import { useField, useFieldProps, useForm, useLocale } from '@payloadcms/ui'
import { useCompletion, experimental_useObject as useObject } from 'ai/react'
import { jsonrepair } from 'jsonrepair'
import { $getRoot } from 'lexical'
import { useCallback, useEffect } from 'react'

import type { GenerateTextarea, MenuItems } from '../../../types.js'

import { DocumentSchema } from '../../../ai/RichTextSchema.js'
import {
  PLUGIN_API_ENDPOINT_GENERATE,
  PLUGIN_API_ENDPOINT_GENERATE_UPLOAD,
} from '../../../defaults.js'
import { useInstructions } from '../../../providers/InstructionsProvider/hook.js'

type UseGenerate = {
  lexicalEditor: LexicalEditor
}

//TODO: DONATION IDEA - Add a url to donate in cli when user installs the plugin and uses it for couple of times.
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

  const { getData } = useForm()
  const localFromContext = useLocale()

  const { object, submit } = useObject({
    api: `/api${PLUGIN_API_ENDPOINT_GENERATE}`,
    onError: (error) => {
      console.error('Error generating object:', error)
    },
    schema: DocumentSchema,
  })

  const { complete, completion } = useCompletion({
    api: `/api${PLUGIN_API_ENDPOINT_GENERATE}`,
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
        const repairedObject = jsonrepair(JSON.stringify(object))
        const editorState = lexicalEditor.parseEditorState(repairedObject)
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
        console.error('Error setting object:', e)
        console.error('Object:', object)
        if (type === 'richText') {
          console.log('type is richText', { setValue })
        }
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
      const doc = getData()
      const options = {
        action,
        instructionId,
      }

      submit({
        doc,
        locale: localFromContext?.code,
        options,
      })
    },
    [getData, localFromContext?.code, instructionId],
  )

  const streamText = useCallback(
    async ({ action = 'Compose' }: { action: MenuItems }) => {
      const doc = getData()
      const options = {
        action,
        instructionId,
      }

      await complete('', {
        body: {
          doc,
          locale: localFromContext?.code,
          options,
        },
      })
    },
    [getData, localFromContext?.code, instructionId],
  )

  const generateUpload = useCallback(async () => {
    const doc = getData()
    return fetch(`/api${PLUGIN_API_ENDPOINT_GENERATE_UPLOAD}`, {
      body: JSON.stringify({
        doc,
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
  }, [getData, localFromContext?.code, instructionId, relationTo, setValue])

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
