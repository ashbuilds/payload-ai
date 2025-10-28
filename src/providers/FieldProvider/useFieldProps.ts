import { useContext } from 'react'

import { FieldContext } from './FieldProvider.js'

export const useFieldProps = () => {
  const { field, path, schemaPath } = useContext(FieldContext)

  return {
    field,
    path,
    schemaPath,
  }
}
