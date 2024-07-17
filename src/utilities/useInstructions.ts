import { useDocumentInfo, useFieldProps } from '@payloadcms/ui'
import { useCallback, useEffect, useState } from 'react'

import type { Instructions } from '../types.js'

export const useInstructions = ({ path }) => {
  const [instructions, setInstructions] = useState<Instructions>()
  const docInfo = useDocumentInfo()
  const { type: fieldType, schemaPath } = useFieldProps()

  const [noticeMessage, setMessage] = useState<{ label: string; message: string }>({
    label: '',
    message: '',
  })

  const addInitialInstructions = useCallback(async () => {
    if (instructions || !schemaPath) return

    try {
      const instructionsDataResponse = await fetch(
        `/api/instructions?where[schema-path][equals]=${schemaPath}&where[field-type][equals]=${fieldType}`,
        {
          credentials: 'include',
        },
      )


      console.log('instructionsDataResponse:', instructionsDataResponse)

      if (!instructionsDataResponse.ok) {
        throw new Error('Failed to fetch instructions data')
      }

      const instructionsDataJson = await instructionsDataResponse.json()

      const [fetchedInstructions] = instructionsDataJson.docs

      setInstructions(fetchedInstructions)
    } catch (error) {
      setMessage({
        label: 'Error',
        message: 'Something went wrong. Please try again.',
      })
      console.error('Error:', error)
    }
  }, [schemaPath, instructions, fieldType])

  useEffect(() => {
    addInitialInstructions().catch((error) => {
      console.error('Error:', error)
    })
  }, [addInitialInstructions])

  return { instructions, noticeMessage, setMessage }
}
