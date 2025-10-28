import React, { createContext, useEffect } from 'react'

const initialContext: {
  description?: string
  fieldName?: string
  hasMany?: boolean
  maxRows?: number
  minRows?: number
  path?: string
  schemaPath?: string
  type?: string
} = {
  type: undefined,
  description: undefined,
  fieldName: undefined,
  hasMany: undefined,
  maxRows: undefined,
  minRows: undefined,
  path: '',
  schemaPath: '',
}

export const FieldContext = createContext(initialContext)

export const FieldProvider = ({
  children,
  context,
}: {
  children: React.ReactNode
  context: {
    description?: string
    fieldName?: string
    hasMany?: boolean
    maxRows?: number
    minRows?: number
    path: string
    schemaPath: unknown
    type: unknown
  }
}) => {
  const [type, setType] = React.useState<string>()
  const [path, setPath] = React.useState<string>()
  const [schemaPath, setSchemaPath] = React.useState<string>()
  const [fieldName, setFieldName] = React.useState<string>()
  const [hasMany, setHasMany] = React.useState<boolean | undefined>()
  const [minRows, setMinRows] = React.useState<number | undefined>()
  const [maxRows, setMaxRows] = React.useState<number | undefined>()
  const [description, setDescription] = React.useState<string | undefined>()

  useEffect(() => {
    if (schemaPath !== context.schemaPath) {
      setType(context.type as string)
      setPath(context.path)
      setSchemaPath(context.schemaPath as string)
      setFieldName(context.fieldName as string)
      setHasMany(context.hasMany)
      setMinRows(context.minRows)
      setMaxRows(context.maxRows)
      setDescription(context.description)
    }
  }, [schemaPath, context])

  return (
    <FieldContext.Provider
      value={{
        type,
        description,
        fieldName,
        hasMany,
        maxRows,
        minRows,
        path,
        schemaPath,
      }}
    >
      {children}
    </FieldContext.Provider>
  )
}
