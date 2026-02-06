'use client'

import type { Field } from 'payload'
import type React from 'react';

import { createContext } from 'react'

import type { SerializedPromptField } from '../../types.js'

export type InstructionsContextValue = {
  activeCollection?: string
  debugging?: boolean
  enabledCollections?: string[]
  enabledLanguages?: string[]
  field?: Field
  hasInstructions: boolean
  instructions: Record<string, any>
  isConfigAllowed: boolean
  openDrawer: (instructionId: string) => void
  path?: string
  promptFields: SerializedPromptField[]
  schemaPath?: unknown
  setActiveCollection?: React.Dispatch<React.SetStateAction<string>>
}

export const initialContext: InstructionsContextValue = {
  debugging: false,
  enabledCollections: [],
  field: undefined,
  hasInstructions: false,
  instructions: {},
  isConfigAllowed: true,
  openDrawer: () => null,
  path: '',
  promptFields: [],
  schemaPath: '',
}

export const InstructionsContext = createContext<InstructionsContextValue>(initialContext)
