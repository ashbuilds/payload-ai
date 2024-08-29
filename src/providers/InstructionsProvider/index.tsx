// @ts-nocheck
import React from 'react'

import { InstructionsProvider as Provider } from './InstructionsProvider.js'

export const InstructionsProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return <Provider>{children}</Provider>
}
