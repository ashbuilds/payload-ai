'use client'

import { useAuth, useConfig, useDocumentDrawer } from '@payloadcms/ui'
import React, { useCallback, useEffect, useState } from 'react'

import type { SerializedPromptField } from '../../types.js'

import { PLUGIN_FETCH_FIELDS_ENDPOINT, PLUGIN_INSTRUCTIONS_TABLE } from '../../defaults.js'
import { useActiveFieldTracking } from '../../ui/Compose/hooks/useActiveFieldTracking.js'
import { InstructionsContext } from './context.js'

export const InstructionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize field tracking globally so ai-plugin-active class is added on field focus
  useActiveFieldTracking()
  
  const [instructions, setInstructionsState] = useState({})
  const [promptFields, setPromptFields] = useState<SerializedPromptField[]>([])
  const [activeCollection, setActiveCollection] = useState('')
  const [isConfigAllowed, setIsConfigAllowed] = useState(false)
  const [enabledLanguages, setEnabledLanguages] = useState<string[]>()
  const [debugging, setDebugging] = useState(false)
  const { user } = useAuth()

  const { config } = useConfig()
  const {
    routes: { api },
    serverURL,
  } = config

  // Global Document Drawer state
  const [drawerInstructionId, setDrawerInstructionId] = useState<string>('')
  const [drawerOpenCount, setDrawerOpenCount] = useState(0)

  const [DocumentDrawer, _, { openDrawer: openPayloadDrawer }] = useDocumentDrawer({
    id: drawerInstructionId,
    collectionSlug: PLUGIN_INSTRUCTIONS_TABLE,
  })

  const openDrawer = useCallback((id: string) => {
    setDrawerInstructionId(id)
    setDrawerOpenCount((prev) => prev + 1)
  }, [])

  // Open drawer when count changes
  useEffect(() => {
    if (drawerOpenCount > 0) {
      openPayloadDrawer()
    }
  }, [drawerOpenCount, openPayloadDrawer])

  // This is here because each field have separate instructions and
  // their ID is needed to edit them for Drawer
  useEffect(() => {
    // Only fetch if we have a user ID - prevents fetching on every user object reference change
    if (!user?.id) {
      return
    }

    fetch(`${serverURL}${api}${PLUGIN_FETCH_FIELDS_ENDPOINT}`)
      .then(async (res) => {
        await res.json().then((data) => {
          setIsConfigAllowed(data?.isConfigAllowed || false)
          setEnabledLanguages(data?.enabledLanguages || [])
          setInstructionsState(data?.fields || {})
          setPromptFields(data?.promptFields || [])
          setDebugging(data?.debugging || false)
        })
      })
      .catch((err) => {
        console.error('InstructionsProvider:', err)
      })
  }, [api, serverURL, user?.id])

  return (
    <InstructionsContext.Provider
      value={{
        activeCollection,
        debugging,
        enabledLanguages,
        hasInstructions: instructions && Object.keys(instructions).length > 0,
        instructions,
        isConfigAllowed,
        openDrawer,
        promptFields,
        setActiveCollection,
      }}
    >
      {children}
      <DocumentDrawer />
    </InstructionsContext.Provider>
  )
}
