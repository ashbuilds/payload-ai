import type { ClientField } from 'payload'

import React, { createContext } from 'react'

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
  // `context` is already current on every render (it's rebuilt by the caller from live
  // field props), so there's no need to mirror it into local state - doing so previously
  // caused `field` to get stuck at whatever value it had on the first render for a given
  // `schemaPath`, including `undefined` if it wasn't populated yet at that point.
  return (
    <FieldContext.Provider
      value={{
        field: context.field,
        path: context.path,
        schemaPath: String(context.schemaPath ?? ''),
      }}
    >
      {children}
    </FieldContext.Provider>
  )
}
