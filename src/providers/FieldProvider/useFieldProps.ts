import { useContext } from 'react'

import { FieldContext } from './FieldProvider.js'

export const useFieldProps = () => {
  const { type, description, fieldName, hasMany, maxRows, minRows, path, schemaPath } =
    useContext(FieldContext)

  return {
    type,
    description,
    fieldName,
    hasMany,
    maxRows,
    minRows,
    path,
    schemaPath,
  }
}
