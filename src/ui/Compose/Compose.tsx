'use client'

import type { ClientField } from 'payload'
import type { FC } from 'react'

import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client'
import { Popup, useField, useTranslation } from '@payloadcms/ui'
import React, { useCallback, useMemo, useState } from 'react'

import type { PluginAITranslationKeys, PluginAITranslations } from '../../translations/index.js'
import type { ActionMenuItems } from '../../types.js'

import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js'
import { setSafeLexicalState } from '../../utilities/lexical/setSafeLexicalState.js'
import { PluginIcon } from '../Icons/Icons.js'
import styles from './compose.module.scss'
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

export const Compose: FC<ComposeProps> = ({
  descriptionProps,
  forceVisible,
  instructionId,
  isConfigAllowed,
}) => {
  const pathFromContext = descriptionProps?.path
  const { editor: lexicalEditor } = useEditorConfigContext()

  // Get global openDrawer from context
  const { openDrawer } = useInstructions()

  // Initialize global active-field tracking
  useActiveFieldTracking()

  const { t } = useTranslation<PluginAITranslations, PluginAITranslationKeys>()

  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const { generate, isJobActive, isLoading, jobProgress, jobStatus, stop } = useGenerate({
    instructionId,
  })

  // Single factory for all action callbacks, eliminating duplication
  const createAction = useCallback(
    (action: ActionMenuItems, params?: unknown) => {
      setIsProcessing(true)
      generate({ action, params })
        .catch((reason) => {
          console.error(`AI Plugin — ${action}:`, reason)
        })
        .finally(() => {
          setIsProcessing(false)
        })
    },
    [generate],
  )

  const onCompose = useCallback(() => createAction('Compose'), [createAction])
  const onExpand = useCallback(() => createAction('Expand'), [createAction])
  const onProofread = useCallback(() => createAction('Proofread'), [createAction])
  const onRephrase = useCallback(() => createAction('Rephrase'), [createAction])
  const onSimplify = useCallback(() => createAction('Simplify'), [createAction])
  const onSummarize = useCallback(() => createAction('Summarize'), [createAction])
  const onTranslate = useCallback(
    (data: unknown) => {
      // If the action is triggered directly via the button click,
      // it passes a React SyntheticEvent which cannot (and should not) be stringified.
      // We only want to pass data if it's the actual payload containing { locale }.
      const isEvent = data && typeof data === 'object' && 'nativeEvent' in data
      return createAction('Translate', isEvent ? undefined : data)
    },
    [createAction],
  )

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
        loadingLabel={
          isJobActive
            ? jobStatus === 'running'
              ? `${t('ai-plugin:general:video' as any)} ${Math.max(0, Math.min(100, Math.round(jobProgress ?? 0)))}%`
              : jobStatus || t('ai-plugin:general:queued' as any)
            : undefined
        }
        stop={stop}
      />
      <div style={{ alignItems: 'center', display: 'flex', gap: '10px', marginLeft: 'auto' }}>
        <UndoRedoActions
          onChange={(val) => {
            setValue(val)
            setIfValueIsLexicalState(val)
          }}
        />
      </div>
    </label>
  )
}
