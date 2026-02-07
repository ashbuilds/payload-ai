import type { LexicalEditor } from 'lexical'

import { useForm } from '@payloadcms/ui'
import { useEffect, useRef } from 'react'

import { useFieldProps } from '../../../providers/FieldProvider/useFieldProps.js'
import { setSafeLexicalState } from '../../../utilities/setSafeLexicalState.js'

type UseStreamingUpdateParams = {
  editor: LexicalEditor
  isLoading: boolean
  object: any
}

export const useStreamingUpdate = ({ editor, isLoading, object }: UseStreamingUpdateParams) => {
  const { field, path: pathFromContext } = useFieldProps()
  const { dispatchFields } = useForm()

  // Ref for latest object to avoid effect re-runs during high-frequency streaming
  const objectRef = useRef(object)
  console.log('currentObject : ', object)
  objectRef.current = object

  useEffect(() => {
    // Only run the animation loop while loading (streaming)
    if (!isLoading) {
      return
    }

    let reqId: number

    const loop = () => {
      const currentObject = objectRef.current

      if (currentObject) {
        if (field?.type === 'richText') {
          setSafeLexicalState(currentObject, editor)
        } else if (field && 'name' in field && currentObject[field.name]) {
          // Use dispatchFields for high-frequency streaming updates to avoid re-renders
          dispatchFields({
            type: 'UPDATE',
            path: pathFromContext ?? '',
            value: currentObject[field.name],
          } as any)
        }
      }

      // Continue loop
      reqId = requestAnimationFrame(loop)
    }

    // Start loop
    loop()

    return () => {
      cancelAnimationFrame(reqId)
    }
  }, [isLoading, editor, field, dispatchFields, pathFromContext])
}
