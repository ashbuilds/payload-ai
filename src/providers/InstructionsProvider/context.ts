'use client'

import type { Field } from 'payload'
import type React from 'react';

import { createContext } from 'react'

import type { SerializedPromptField } from '../../types.js'

export type InstructionsContextValue = {
  activeCollection?: string
  debugging?: boolean
  enabledLanguages?: string[]
  field?: Field
  hasInstructions: boolean
  instructions: Record<string, any>
  isConfigAllowed: boolean
  path?: string
  promptFields: SerializedPromptField[]
  schemaPath?: unknown
  setActiveCollection?: React.Dispatch<React.SetStateAction<string>>
}

export const initialContext: InstructionsContextValue = {
  debugging: false,
  field: undefined,
  hasInstructions: false,
  instructions: {},
  isConfigAllowed: true,
  path: '',
  promptFields: [],
  schemaPath: '',
}

export const InstructionsContext = createContext<InstructionsContextValue>(initialContext)
