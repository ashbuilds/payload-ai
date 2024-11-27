'use client'

import type { Field } from 'payload'

import { useConfig } from '@payloadcms/ui'
import React, { createContext, useEffect, useState } from 'react'

import { PLUGIN_FETCH_FIELDS_ENDPOINT } from '../../defaults.js'

const initialContext: {
  field?: Field
  instructions: Record<string, any>
  path?: string
  schemaPath?: unknown
} = {
  field: undefined,
  instructions: undefined,
  path: '',
  schemaPath: '',
}

export const InstructionsContext = createContext(initialContext)

export const InstructionsProvider: React.FC = ({ children }: { children: React.ReactNode }) => {
  const [instructions, setInstructionsState] = useState({})

  const { config } = useConfig()
  const {
    routes: { api },
    serverURL,
  } = config

  // This is here because each field have separate instructions and
  // their ID is needed to edit them for Drawer
  useEffect(() => {
    fetch(`${serverURL}${api}${PLUGIN_FETCH_FIELDS_ENDPOINT}`)
      .then(async (res) => {
        await res.json().then((data) => {
          setInstructionsState(data)
        })
      })
      .catch((err) => {
        console.error('InstructionsProvider:', err)
      })
  }, [])

  return (
    <InstructionsContext.Provider value={{ instructions }}>{children}</InstructionsContext.Provider>
  )
}
