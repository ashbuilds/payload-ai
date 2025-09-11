'use client'

import type { Field } from 'payload'
import type React from 'react';

import { createContext } from 'react'

import type { SerializedPromptField } from '../../types.js'

export type InstructionsContextValue = {
  activeCollection?: string
  enabledLanguages?: string[]
  field?: Field
  instructions: Record<string, any>
  isConfigAllowed: boolean
  path?: string
  promptFields: SerializedPromptField[]
  schemaPath?: unknown
  setActiveCollection?: React.Dispatch<React.SetStateAction<string>>
}

export const initialContext: InstructionsContextValue = {
  field: undefined,
  instructions: {},
  isConfigAllowed: true,
  path: '',
  promptFields: [],
  schemaPath: '',
}

export const InstructionsContext = createContext<InstructionsContextValue>(initialContext)
