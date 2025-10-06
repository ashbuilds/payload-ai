'use client'


import { useAuth, useConfig } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

import type { SerializedPromptField } from '../../types.js'

import { PLUGIN_FETCH_FIELDS_ENDPOINT } from '../../defaults.js'
import { InstructionsContext } from './context.js'


export const InstructionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [instructions, setInstructionsState] = useState({})
  const [promptFields, setPromptFields] = useState<SerializedPromptField[]>([])
  const [activeCollection, setActiveCollection] = useState('')
  const [isConfigAllowed, setIsConfigAllowed] = useState(false)
  const [enabledLanguages, setEnabledLanguages] = useState<string[]>()
  const [enabledCollections, setEnabledCollections] = useState<string[] | undefined>()
  const [debugging, setDebugging] = useState(false)
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
          setIsConfigAllowed(data?.isConfigAllowed || false)
          setEnabledLanguages(data?.enabledLanguages || [])
          setEnabledCollections(data?.enabledCollections)
          setInstructionsState(data?.fields || {})
          setPromptFields(data?.promptFields || [])
          setDebugging(data?.debugging || false)
        })
      })
      .catch((err) => {
        console.error('InstructionsProvider:', err)
      })
  }, [api, serverURL, user])

  return (
    <InstructionsContext.Provider
      value={{
        activeCollection,
        debugging,
        enabledCollections,
        enabledLanguages,
        hasInstructions: instructions && Object.keys(instructions).length > 0,
        instructions,
        isConfigAllowed,
        promptFields,
        setActiveCollection,
      }}
    >
      {children}
    </InstructionsContext.Provider>
  )
}
