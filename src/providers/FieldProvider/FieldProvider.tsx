import type { ClientField } from 'payload'

import React, { createContext, useMemo } from 'react'

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
  const value = useMemo(
    () => ({
      field: context.field,
      path: context.path,
      schemaPath: String(context.schemaPath ?? ''),
    }),
    [context.field, context.path, context.schemaPath],
  )

  return (
    <FieldContext value={value}>
      {children}
    </FieldContext>
  )
}
