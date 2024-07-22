import { useDocumentInfo, useField, useFieldProps, useLocale } from '@payloadcms/ui'
import { useCallback } from 'react'

import { GenerateTextarea, MenuItems } from '../types.js'

import { useInstructions } from '../providers/InstructionsProvider/index.js'
import { useDotFields } from './useDotFields.js'

type Generate = (options: { action: MenuItems }) => Promise<void | Response>

export const useGenerate = () => {
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

  const generateText = useCallback<Generate>(
    async ({ action = 'Compose' }: { action: MenuItems }) => {
      const { fields = {} } = getDotFields()
      if (!Object.keys(fields).length) {
        console.log('dotFields is empty')
        return
      }

      const options = {
        instructionId,
        action,
      }

      console.log('options:', options)
      return fetch('/api/ai/generate/textarea', {
        body: JSON.stringify({
          doc: fields,
          locale: localFromContext?.code,
          options: options,
        } satisfies Parameters<GenerateTextarea>[0]),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
        .then(async (generatedResponse) => {
          if (generatedResponse.ok) {
            const { result } = await generatedResponse.json()
            console.log('generatedResult:', result)
            setValue(result)
          } else {
            const { errors = [] } = await generatedResponse.json()
            const errStr = errors.map((error) => error.message).join(', ')
            throw new Error(errStr)
          }
          return generatedResponse
        })
        .catch((error) => {
          console.error('Error generating image', error)
        })
    },
    [getDotFields, localFromContext?.code, instructionId, setValue],
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

  return async (options?: { action: MenuItems }) => {
    if (['richText', 'text', 'textarea'].includes(type)) {
      return generateText(options)
    }
    if (type === 'upload') {
      return generateUpload()
    }
  }
}
