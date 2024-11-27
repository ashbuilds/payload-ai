import { useContext } from 'react'

import { FieldContext } from './FieldProvider.js'

export const useFieldProps = () => {
  const { type, path, schemaPath } = useContext(FieldContext)

  return {
    type,
    path,
    schemaPath,
  }
}
