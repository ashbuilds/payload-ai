import React, { createContext, useEffect } from 'react'

const initialContext: {
  path?: string
  schemaPath?: string
  type?: string
} = {
  type: undefined,
  path: '',
  schemaPath: '',
}

export const FieldContext = createContext(initialContext)

export const FieldProvider = ({
  children,
  context,
}: {
  children: React.ReactNode
  context: { path: string; schemaPath: unknown; type: unknown }
}) => {
  const [type, setType] = React.useState<string>()
  const [path, setPath] = React.useState<string>()
  const [schemaPath, setSchemaPath] = React.useState<string>()

  useEffect(() => {
    if (schemaPath !== context.schemaPath) {
      setType(context.type as string)
      setPath(context.path)
      setSchemaPath(context.schemaPath as string)
    }
  }, [schemaPath, context])

  return (
    <FieldContext.Provider
      value={{
        type,
        path,
        schemaPath,
      }}
    >
      {children}
    </FieldContext.Provider>
  )
}
