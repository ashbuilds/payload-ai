'use client'

import type { ClientField } from 'payload'
import type { FC } from 'react'

import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { Popup, useField } from '@payloadcms/ui'
import React, { useCallback, useMemo, useState } from 'react'

import { PLUGIN_INSTRUCTIONS_TABLE } from '../../defaults.js'
import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { setSafeLexicalState } from '../../utilities/setSafeLexicalState.js'
import { PluginIcon } from '../Icons/Icons.js'
import styles from './compose.module.css'
import { useMenu } from './hooks/menu/useMenu.js'
import { useActiveFieldTracking } from './hooks/useActiveFieldTracking.js'
import { useGenerate } from './hooks/useGenerate.js'
import { UndoRedoActions } from './UndoRedoActions.js'

export type ComposeProps = {
  descriptionProps?: {
    field: ClientField
    path: string
    schemaPath: string
  }
  forceVisible?: boolean
  instructionId: string
  isConfigAllowed: boolean
}

export const Compose: FC<ComposeProps> = ({ descriptionProps, forceVisible, instructionId, isConfigAllowed }) => {
  const pathFromContext = descriptionProps?.path
  const { editor: lexicalEditor } = useEditorConfigContext()
  
  // Get global openDrawer from context
  const { openDrawer } = useInstructions()

  // Initialize global active-field tracking
  useActiveFieldTracking()

  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const { generate, isJobActive, isLoading, jobProgress, jobStatus, stop } = useGenerate({ instructionId })

  // Memoize menu event handlers to prevent recreation on every render
  const onCompose = useCallback(() => {
    console.log('Composing...')
    setIsProcessing(true)
    generate({
      action: 'Compose',
    })
      .catch((reason) => {
        console.error('Compose : ', reason)
      })
      .finally(() => {
        setIsProcessing(false)
      })
  }, [generate])

  const onExpand = useCallback(() => {
    console.log('Expanding...')
    generate({
      action: 'Expand',
    })
      .catch((reason) => {
        console.error('Compose : ', reason)
      })
      .finally(() => {
        setIsProcessing(false)
      })
  }, [generate])

  const onProofread = useCallback(() => {
    console.log('Proofreading...')
    generate({
      action: 'Proofread',
    })
      .catch((reason) => {
        console.error('Compose : ', reason)
      })
      .finally(() => {
        setIsProcessing(false)
      })
  }, [generate])

  const onRephrase = useCallback(() => {
    console.log('Rephrasing...')
    generate({
      action: 'Rephrase',
    })
      .catch((reason) => {
        console.error('Compose : ', reason)
      })
      .finally(() => {
        setIsProcessing(false)
      })
  }, [generate])

  const onSimplify = useCallback(() => {
    console.log('Simplifying...')
    generate({
      action: 'Simplify',
    })
      .catch((reason) => {
        console.error('Compose : ', reason)
      })
      .finally(() => {
        setIsProcessing(false)
      })
  }, [generate])

  const onSummarize = useCallback(() => {
    console.log('Summarizing...')
    generate({
      action: 'Summarize',
    })
      .catch((reason) => {
        console.error('Compose : ', reason)
      })
      .finally(() => {
        setIsProcessing(false)
      })
  }, [generate])

  const onTranslate = useCallback((data: unknown) => {
    console.log('Translating...')
    generate({
      action: 'Translate',
      params: data,
    })
      .catch((reason) => {
        console.error('Compose : ', reason)
      })
      .finally(() => {
        setIsProcessing(false)
      })
  }, [generate])

  const handleOpenSettings = useCallback(() => {
    if (isConfigAllowed) {
      openDrawer(instructionId)
    }
  }, [isConfigAllowed, openDrawer, instructionId])

  const { ActiveComponent, Menu } = useMenu(
    {
      onCompose,
      onExpand,
      onProofread,
      onRephrase,
      onSettings: isConfigAllowed ? handleOpenSettings : undefined,
      onSimplify,
      onSummarize,
      onTranslate,
    },
    {
      isConfigAllowed,
    },
  )

  const { setValue } = useField<string>({
    path: pathFromContext,
  })

  const setIfValueIsLexicalState = useCallback((val: any) => {
    // Prevent setting incomplete states during streaming
    if (!val || typeof val !== 'object' || !('root' in val) || !lexicalEditor) {
      return
    }

    // Validate that the state is complete before setting
    // Check for common incomplete streaming states
    if (!val.root || typeof val.root !== 'object' || Object.keys(val.root).length === 0) {
      return
    }

    if (val.root.type !== 'root') {
      return
    }

    if (!val.root.children || !Array.isArray(val.root.children) || val.root.children.length === 0) {
      return
    }

    // Check for invalid child types (common streaming issue)
    const hasInvalidChildren = val.root.children.some(
      (child: any) => !child || !child.type || child.type === 'undefined' || child.type === '',
    )

    if (hasInvalidChildren) {
      return
    }

    // State looks valid, proceed
    setSafeLexicalState(JSON.stringify(val), lexicalEditor)

    // DO NOT PROVIDE lexicalEditor as a dependency, it freaks out and does not update the editor after first undo/redo - revisit
  }, [])

  const popupRender = useCallback(
    ({ close }: { close: () => void }) => {
      return <Menu isLoading={isProcessing || isLoading} onClose={close} />
    },
    [isProcessing, isLoading, Menu],
  )

  // Combine loading states to reduce re-renders
  const isAnyLoading = isProcessing || isLoading || isJobActive

  const memoizedPopup = useMemo(() => {
    return (
      <Popup
        button={<PluginIcon isLoading={isAnyLoading} />}
        render={popupRender}
        verticalAlign="bottom"
      />
    )
  }, [popupRender, isAnyLoading])

  return (
    <label
      className={`payloadai-compose__actions ${styles.actions} ${forceVisible ? styles.actionsVisible : ''}`}
      onClick={(e) => e.preventDefault()}
      role="presentation"
    >
      {memoizedPopup}
      <ActiveComponent
        isLoading={isProcessing || isLoading || isJobActive}
        loadingLabel={isJobActive ? (jobStatus === 'running' ? `Video ${Math.max(0, Math.min(100, Math.round(jobProgress ?? 0)))}%` : (jobStatus || 'Queued')) : undefined}
        stop={stop}
      />
      <UndoRedoActions
        onChange={(val) => {
          setValue(val)
          setIfValueIsLexicalState(val)
        }}
      />
    </label>
  )
}
