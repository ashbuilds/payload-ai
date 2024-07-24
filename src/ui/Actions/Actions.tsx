'use client'

import { FieldDescription, Popup, useDocumentDrawer, useField, useFieldProps } from '@payloadcms/ui'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { PromptContext } from '../../providers/Prompt/index.js'
import { useDotFields } from '../../utilities/useDotFields.js'
import { useGenerate } from '../../utilities/useGenerate.js'
import styles from './actions.module.scss'
import { AiIcon3, PluginIcon } from './icons.js'
import { useMenu } from './useMenu.js'
import LottieAnimation from './LottieAnimation.js'
// import { LexicalRichTextAdapterProvider } from '@payloadcms/richtext-lexical'
// import { useEditorConfigContext } from '@payloadcms/richtext-lexical/dist/lexical/config/client/EditorConfigProvider.js'
import { getNearestEditorFromDOMNode } from 'lexical'
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
  const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer, openDrawer }] = useDocumentDrawer({
    id: instructionId,
    collectionSlug: 'instructions',
  })

  const { dotFields } = useDotFields()
  const fieldProps = useFieldProps()
  const { path: pathFromContext, schemaPath, type: fieldType } = fieldProps
  const currentField = useField({
    path: pathFromContext,
  })

  const [fieldsInfo, setFieldsInfo] = useState(null)
  useEffect(() => {
    if (!dotFields) return

    setFieldsInfo({
      fields: Object.keys(dotFields),
      selectedField: {
        field: currentField,
        //TODO: Why props need to be passed?
        props: fieldProps,
      },
    })
  }, [dotFields, currentField, fieldProps])

  const [input, setInput] = useState(null)
  const [lexicalEditor, setLexicalEditor] = useState()
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

  const generate = useGenerate({ lexicalEditor })
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
      onProofread: async () => {
        console.log('Proofreading...')
        setIsProcessing(true)
        await generate({
          action: 'Proofread',
        }).finally(() => {
          setIsProcessing(false)
        })
      },
      onRephrase: async () => {
        console.log('Rephrasing...', !isProcessing)
        setIsProcessing(true)
        await generate({
          action: 'Rephrase',
        }).finally(() => {
          setIsProcessing(false)
        })
      },
      onExpand: async () => {
        setIsProcessing(true)
        await generate({
          action: 'Expand',
        }).finally(() => {
          setIsProcessing(false)
        })
      },
      onSimplify: async () => {
        setIsProcessing(true)
        await generate({
          action: 'Simplify',
        }).finally(() => {
          setIsProcessing(false)
        })
      },
      onSettings: openDrawer,
    },
  )

  return (
    <React.Fragment>
      <label className={`${styles.actions}`} ref={actionsRef}>
        <PromptContext.Provider value={fieldsInfo}>
          <DocumentDrawer
            onSave={() => {
              closeDrawer()
            }}
          />
        </PromptContext.Provider>
        <Popup
          button={<PluginIcon isLoading={isProcessing} />}
          verticalAlign={'bottom'}
          render={({ close }) => {
            return <Menu onClose={close} />
          }}
        />
        <ActiveComponent />
      </label>
      <div>
        <FieldDescription {...descriptionProps} />
      </div>
    </React.Fragment>
  )
}
