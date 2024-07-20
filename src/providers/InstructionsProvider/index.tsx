'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

const initialContext = {
  instructions: undefined,
}

const InstructionsContext = createContext(initialContext)

export const InstructionsProvider = ({ children }: { children: React.ReactNode }) => {
  const [instructions, setInstructionsState] = useState({})

  useEffect(() => {
    fetch('/api/globals/ai-plugin__instructions_map')
      .then((res) => {
        res.json().then((data) => {
          setInstructionsState(data.map)
        })
      })
      .catch((err) => {
        console.error('err:', err)
      })
  }, [])

  return (
    <InstructionsContext.Provider value={{ instructions }}>{children}</InstructionsContext.Provider>
  )
}

export const useInstructions = ({ path }) => {
  const context = useContext(InstructionsContext)

  return { id: context.instructions[path], map: context.instructions }
}
