'use client'

import { FieldLabel, useField, useFieldProps } from '@payloadcms/ui'
import React from 'react'

import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { AutocompleteTextField } from '../../libraries/autocomplete/AutocompleteTextArea.js'
import { TextareaFieldClientProps } from 'payload'

//NOTE: HMR does not work for plugin components anymore, I think it has to do with importMap/ string path
export const PromptEditorField: React.FC<TextareaFieldClientProps> = (props) => {
  const { field } = props
  const { path: pathFromContext } = useFieldProps()

  const { setValue, value } = useField<string>({
    path: pathFromContext,
  })

  const { promptEditorSuggestions } = useInstructions({
    path: pathFromContext,
  })

  return (
    <div className="field-type textarea">
      <FieldLabel field={field} label={field.label} />
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
    </div>
  )
}
