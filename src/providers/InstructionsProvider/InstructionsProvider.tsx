'use client'

import type { Field } from 'payload'

import { useAuth, useConfig } from '@payloadcms/ui'
import React, { createContext, useEffect, useState } from 'react'

import { PLUGIN_FETCH_FIELDS_ENDPOINT } from '../../defaults.js'

const initialContext: {
  activeCollection?: string
  enabledLanguages?: string[]
  field?: Field
  instructions: Record<string, any>
  isConfigAllowed: boolean
  path?: string
  schemaPath?: unknown
  setActiveCollection?: (val: unknown) => void
} = {
  field: undefined,
  instructions: undefined,
  isConfigAllowed: true,
  path: '',
  schemaPath: '',
}

export const InstructionsContext = createContext(initialContext)

export const InstructionsProvider: React.FC = ({ children }: { children: React.ReactNode }) => {
  const [instructions, setInstructionsState] = useState({})
  const [activeCollection, setActiveCollection] = useState('')
  const [isConfigAllowed, setIsConfigAllowed] = useState(false)
  const [enabledLanguages, setEnabledLanguages] = useState<string[]>()
  const { user } = useAuth()

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
          setIsConfigAllowed(data?.isConfigAllowed)
          setEnabledLanguages(data?.enabledLanguages)
          setInstructionsState(data?.fields)
        })
      })
      .catch((err) => {
        console.error('InstructionsProvider:', err)
      })
  }, [user])

  return (
    <InstructionsContext.Provider
      value={{
        activeCollection,
        enabledLanguages,
        instructions,
        isConfigAllowed,
        setActiveCollection,
      }}
    >
      {children}
    </InstructionsContext.Provider>
  )
}
