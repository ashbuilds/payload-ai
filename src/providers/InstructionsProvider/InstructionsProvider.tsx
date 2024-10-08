'use client'

import { getPayload } from 'payload'
import React, { createContext, useEffect, useState } from 'react'

import type { GenerateTextarea } from '../../types.js'

import { PLUGIN_FETCH_FIELDS_ENDPOINT } from '../../defaults.js'

const initialContext = {
  instructions: undefined,
}

export const InstructionsContext = createContext(initialContext)

export const InstructionsProvider: React.FC = ({ children }: { children: React.ReactNode }) => {
  const [instructions, setInstructionsState] = useState({})

  // This is here because each field have separate instructions and
  // their ID is needed to edit them for Drawer
  useEffect(() => {
    fetch(`api/${PLUGIN_FETCH_FIELDS_ENDPOINT}`)
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
