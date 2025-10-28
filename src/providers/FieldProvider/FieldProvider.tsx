import type { ClientField } from 'payload'

import React, { createContext, useEffect } from 'react'

type FieldContextType = {
  field?: ClientField
  path?: string
  schemaPath?: string
}

const initialContext: FieldContextType = {
  field: undefined,
  path: '',
  schemaPath: '',
}

export const FieldContext = createContext<FieldContextType>(initialContext)

export const FieldProvider = ({
  children,
  context,
}: {
  children: React.ReactNode
  context: {
    field?: ClientField
    path: string
    schemaPath: unknown
  }
}) => {
  const [field, setField] = React.useState<ClientField | undefined>()
  const [path, setPath] = React.useState<string>()
  const [schemaPath, setSchemaPath] = React.useState<string>()

  useEffect(() => {
    const nextSchemaPath = String(context.schemaPath ?? '')
    if (schemaPath !== nextSchemaPath) {
      setField(context.field)
      setPath(context.path)
      setSchemaPath(nextSchemaPath)
    }
  }, [schemaPath, context])

  return (
    <FieldContext.Provider
      value={{
        field,
        path,
        schemaPath,
      }}
    >
      {children}
    </FieldContext.Provider>
  )
}
