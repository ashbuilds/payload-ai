'use client'

import type { ClientField } from 'payload'
import type { FC } from 'react'

import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { Popup, useDocumentDrawer, useField } from '@payloadcms/ui'
import React, { useCallback, useMemo, useState } from 'react'

import { PLUGIN_INSTRUCTIONS_TABLE } from '../../defaults.js'
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
  instructionId: string
  isConfigAllowed: boolean
}

export const Compose: FC<ComposeProps> = ({ descriptionProps, instructionId, isConfigAllowed }) => {
  const [DocumentDrawer, _, { closeDrawer, openDrawer }] = useDocumentDrawer({
    id: instructionId,
    collectionSlug: PLUGIN_INSTRUCTIONS_TABLE,
  })

  const pathFromContext = descriptionProps?.path
  const { editor: lexicalEditor } = useEditorConfigContext()

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

  const { ActiveComponent, Menu } = useMenu(
    {
      onCompose,
      onExpand,
      onProofread,
      onRephrase,
      onSettings: isConfigAllowed ? openDrawer : undefined,
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
    if (val && typeof val === 'object' && 'root' in val && lexicalEditor) {
      setSafeLexicalState(JSON.stringify(val), lexicalEditor)
    }

    // DO NOT PROVIDE lexicalEditor as a dependency, it freaks out and does not update the editor after first undo/redo
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
      className={`payloadai-compose__actions ${styles.actions}`}
      onClick={(e) => e.preventDefault()}
      role="presentation"
    >
      <DocumentDrawer
        onSave={() => {
          closeDrawer()
        }}
      />
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
