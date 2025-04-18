'use client'

import type { TextareaFieldClientProps } from 'payload'

import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui'
import React from 'react'

import { AutocompleteTextField } from '../../libraries/autocomplete/AutocompleteTextArea.js'
import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'

//NOTE: HMR does not work for plugin components anymore, I think it has to do with importMap/ string path
export const PromptEditorField: React.FC<TextareaFieldClientProps> = (props) => {
  const { field, path: pathFromContext } = props

  const { setValue, value } = useField<string>({
    path: pathFromContext,
  })

  const { promptEditorSuggestions } = useInstructions()

  return (
    <div className="field-type textarea">
      <FieldLabel label={field.label} />
      <AutocompleteTextField
        changeOnSelect={(trigger, selected) => {
          return trigger + selected + ' }}'
        }}
        onChange={(val: string) => {
          setValue(val)
        }}
        options={promptEditorSuggestions}
        trigger={['{{ ']}
        value={value}
      />
      <FieldDescription description={field?.admin?.description} path="" />
    </div>
  )
}
