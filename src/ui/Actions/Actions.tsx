'use client'

import type { LexicalEditor } from 'lexical'

import { FieldDescription, Popup, useDocumentDrawer, useField, useFieldProps } from '@payloadcms/ui'
import { $getRoot } from 'lexical'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import { PluginIcon } from '../Icons/Icons.js'
import styles from './actions.module.scss'
import { useGenerate } from './hooks/useGenerate.js'
import { useHistory } from './hooks/useHistory.js'
import { useMenu } from './hooks/useMenu.js'

function findParentWithClass(element, className) {
  // Base case: if the element is null or we've reached the top of the DOM
  if (!element || element === document.body) {
    return null
  }

  // Check if the current element has the class we're looking for
  if (element.classList.contains(className)) {
    return element
  }

  // Recursively call the function on the parent element
  return findParentWithClass(element.parentElement, className)
}

//TODO: Add undo/redo to the actions toolbar
export const Actions = ({ descriptionProps, instructionId }) => {
  const [DocumentDrawer, _, { closeDrawer, openDrawer }] = useDocumentDrawer({
    id: instructionId,
    collectionSlug: 'instructions',
  })

  const fieldProps = useFieldProps()
  const { type: fieldType, path: pathFromContext, schemaPath } = fieldProps

  const [input, setInput] = useState(null)
  const [lexicalEditor, setLexicalEditor] = useState<LexicalEditor>()
  const actionsRef = useRef(null)
  // Used to show the actions menu on active input fields
  useEffect(() => {
    const fieldId = `field-${pathFromContext.replace(/\./g, '__')}`
    let inputElement = document.getElementById(fieldId)

    if (!actionsRef.current) return
    actionsRef.current.setAttribute('for', fieldId)

    if (!inputElement) {
      if (fieldType === 'richText') {
        const editorWrapper = findParentWithClass(actionsRef.current, 'field-type')
        //TODO: Find a better way get rich-text field instance
        setTimeout(() => {
          inputElement = editorWrapper.querySelector('div[contenteditable="true"]')
          // @ts-expect-error
          setLexicalEditor(inputElement.__lexicalEditor)
          setInput(inputElement)
        }, 0)
      }
    } else {
      setInput(inputElement)
    }
  }, [pathFromContext, schemaPath, actionsRef])

  useEffect(() => {
    if (!input || !actionsRef.current) return

    actionsRef.current.classList.add(styles.actions_hidden)
    input.addEventListener('click', (event) => {
      document.querySelectorAll('.ai-plugin-active')?.forEach((element) => {
        element.querySelector(`.${styles.actions}`).classList.add(styles.actions_hidden)
        element.classList.remove('ai-plugin-active')
      })

      actionsRef.current.classList.remove(styles.actions_hidden)
      const parentWithClass = findParentWithClass(event.target, 'field-type')
      parentWithClass.classList.add('ai-plugin-active')
    })
  }, [input, actionsRef])

  const [isProcessing, setIsProcessing] = useState(false)

  const { generate, isLoading } = useGenerate({ lexicalEditor })
  const { ActiveComponent, Menu } = useMenu(
    { lexicalEditor },
    {
      onCompose: async () => {
        console.log('Composing...')
        setIsProcessing(true)
        await generate({
          action: 'Compose',
        }).finally(() => {
          setIsProcessing(false)
        })
      },
      onExpand: async () => {
        console.log('Expanding...')
        await generate({
          action: 'Expand',
        })
      },
      onProofread: async () => {
        console.log('Proofreading...')
        await generate({
          action: 'Proofread',
        })
      },
      onRephrase: async () => {
        console.log('Rephrasing...')
        await generate({
          action: 'Rephrase',
        })
      },
      onSettings: openDrawer,
      onSimplify: async () => {
        console.log('Simplifying...')
        await generate({
          action: 'Simplify',
        })
      },
    },
  )

  const { setValue } = useField<string>({
    path: pathFromContext,
  })
  const { canRedo, canUndo, redo, undo } = useHistory()

  const setIfValueIsLexicalState = useCallback(
    (val) => {
      if (val.root && lexicalEditor) {
        const editorState = lexicalEditor.parseEditorState(JSON.stringify(val))
        if (editorState.isEmpty()) return

        lexicalEditor.update(() => {
          lexicalEditor.setEditorState(editorState)
        })
      }
    },
    [lexicalEditor],
  )

  const redoHistoryValue = useCallback(() => {
    const val = redo()
    if (val) {
      setValue(val)
      setIfValueIsLexicalState(val)
    }
  }, [redo, setIfValueIsLexicalState])

  const undoHistoryValue = useCallback(() => {
    const val = undo()
    if (val) {
      setValue(val)
      setIfValueIsLexicalState(val)
    }
  }, [undo, setIfValueIsLexicalState])

  return (
    <React.Fragment>
      <label className={`${styles.actions}`} ref={actionsRef}>
        <DocumentDrawer
          onSave={() => {
            closeDrawer()
          }}
        />
        <Popup
          button={<PluginIcon isLoading={isProcessing || isLoading} />}
          render={({ close }) => {
            return <Menu isLoading={isProcessing || isLoading} onClose={close} />
          }}
          verticalAlign="bottom"
        />
        <ActiveComponent isLoading={isProcessing || isLoading} />
        <button disabled={!canUndo} onClick={undoHistoryValue} type="button">
          Undo
        </button>
        <button disabled={!canRedo} onClick={redoHistoryValue} type="button">
          Redo
        </button>
      </label>
      <div>
        <FieldDescription {...descriptionProps} />
      </div>
    </React.Fragment>
  )
}
