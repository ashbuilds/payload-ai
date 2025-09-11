'use client'

import type { TextareaFieldClientProps } from 'payload'

import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Mention, MentionsInput } from 'react-mentions/dist/react-mentions.cjs.js'

import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { defaultStyle } from './defaultStyle.js'

export const PromptEditorField: React.FC<TextareaFieldClientProps> = (props) => {
  const { field, path: pathFromContext } = props
  const { setValue, value: payloadValue } = useField<string>({
    path: pathFromContext,
  })

  const [localValue, setLocalValue] = useState(payloadValue || '')
  const hasInitialized = useRef(false)

  const { promptEditorSuggestions } = useInstructions()

  const suggestions = useMemo(
    () =>
      promptEditorSuggestions.map((suggestion: string) => ({
        id: suggestion,
        display: suggestion,
      })),
    [promptEditorSuggestions],
  )

  useEffect(() => {
    if (!hasInitialized.current || payloadValue === '') {
      setLocalValue(payloadValue || '')
      hasInitialized.current = true
    }
  }, [payloadValue])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value)
  }, [])

  const handleBlur = useCallback(() => {
    setValue(localValue)
  }, [localValue, setValue])

  const displayTransform = useCallback((id: string) => `{{ ${id} }}`, [])

  return (
    <div className="field-type textarea">
      <FieldLabel label={field.label} />
      <MentionsInput
        onBlur={handleBlur}
        onChange={handleChange}
        placeholder="Type your prompt using {{ fieldName }} variables..."
        style={defaultStyle}
        value={localValue}
      >
        <Mention
          data={suggestions}
          displayTransform={displayTransform}
          markup="{{__id__}}"
          style={{
            backgroundColor: 'var(--theme-elevation-100)',
            padding: '2px 0',
          }}
          trigger="{"
        />
      </MentionsInput>
      <FieldDescription description={field?.admin?.description} path="" />
    </div>
  )
}
