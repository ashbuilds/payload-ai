import { useDocumentInfo, useField, useFieldProps, useLocale } from '@payloadcms/ui'
import { useCallback } from 'react'

import type { GenerateTextarea } from '../types.js'

import { useInstructions } from '../providers/InstructionsProvider/index.js'
import { useDotFields } from './useDotFields.js'

export const useGenerate = () => {
  const { path: pathFromContext, schemaPath } = useFieldProps()

  const docInfo = useDocumentInfo()

  const relationTo = 'media'

  const { setValue } = useField<string>({
    path: pathFromContext,
  })

  const { id: instructionId } = useInstructions({
    path: schemaPath,
  })

  const localFromContext = useLocale()
  const { getDotFields } = useDotFields()
  const generateText = useCallback(() => {
    const { fields = {} } = getDotFields()
    if (!Object.keys(fields).length) {
      console.log('dotFields is empty')
      return
    }

    fetch('/api/ai/generate/textarea', {
      body: JSON.stringify({
        ...docInfo,
        doc: fields,
        locale: localFromContext?.code,
        options: {
          instructionId,
        },
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
      })
      .catch((error) => {
        console.error('Error generating image', error)
      })
  }, [getDotFields, docInfo, localFromContext?.code, instructionId, setValue])

  const generateUpload = useCallback(() => {
    const { fields = {} } = getDotFields()
    if (!Object.keys(fields).length) {
      console.log('dotFields is empty')
      return
    }

    fetch('/api/ai/generate/upload', {
      body: JSON.stringify({
        ...docInfo,
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
      })
      .catch((error) => {
        console.error('Error generating image', error)
      })
  }, [getDotFields, docInfo, localFromContext?.code, instructionId, relationTo, setValue])

  return {
    richText: generateText,
    text: generateText,
    textarea: generateText,
    upload: generateUpload,
  }
}
