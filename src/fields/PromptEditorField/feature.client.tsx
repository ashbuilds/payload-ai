'use client'

import type {
  BeautifulMentionsItem} from 'lexical-beautiful-mentions';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import {
  BeautifulMentionNode,
  BeautifulMentionsPlugin,
  BeautifulMentionsTheme,
} from 'lexical-beautiful-mentions'
import React, { forwardRef, useCallback } from 'react'

const PromptMentionsMenu = ({
  children,
  className,
  loading,
  ref,
  style,
  ...props
}: {
  children?: React.ReactNode
  className?: string
  loading?: boolean
  role?: string
  style?: React.CSSProperties
} & { ref?: React.RefObject<HTMLUListElement | null> }) => {
  return (
    <ul
      className={className}
      ref={ref}
      style={{
        backgroundColor: 'var(--theme-elevation-0)',
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '4px',
        boxShadow: '0 4px 12px 0 rgba(0,0,0,0.1)',
        listStyle: 'none',
        margin: 0,
        maxHeight: '300px',
        minWidth: '250px',
        overflowY: 'auto',
        padding: '4px 0',
        position: 'absolute',
        width: 'max-content',
        zIndex: 100,
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <li
          style={{
            color: 'var(--theme-elevation-500)',
            fontSize: '14px',
            padding: '8px 12px',
          }}
        >
          Loading...
        </li>
      ) : (
        children
      )}
    </ul>
  )
}
PromptMentionsMenu.displayName = 'PromptMentionsMenu'

const PromptMentionsMenuItem = ({
  children,
  className,
  isFocused,
  itemValue,
  label,
  ref,
  selected,
  style,
  ...props
}: {
  children?: React.ReactNode
  className?: string
  isFocused?: boolean
  itemValue?: string
  label?: string
  onClick?: () => void
  onMouseEnter?: () => void
  role?: string
  selected?: boolean
  style?: React.CSSProperties
} & { ref?: React.RefObject<HTMLLIElement | null> }) => {
  return (
    <li
      className={className}
      ref={ref}
      style={{
        alignItems: 'center',
        backgroundColor: selected || isFocused ? 'var(--theme-elevation-100)' : 'transparent',
        color: 'var(--theme-elevation-800)',
        cursor: 'pointer',
        display: 'flex',
        fontSize: '14px',
        lineHeight: '1.5',
        padding: '8px 12px',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...props}
    >
      {label || children}
    </li>
  )
}
PromptMentionsMenuItem.displayName = 'PromptMentionsMenuItem'

const PromptMentionsPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext()
  const suggestionsRef = React.useRef<Record<string, any[]>>({})
  const [isLoaded, setIsLoaded] = React.useState(false)

  const getDocInfo = useCallback(() => {
    let collectionSlug = ''
    let docId = ''
    if (typeof window !== 'undefined') {
      const segments = window.location.pathname.split('/')
      const collectionsIndex = segments.indexOf('collections')
      if (collectionsIndex > -1 && segments.length > collectionsIndex + 1) {
        collectionSlug = segments[collectionsIndex + 1]
        docId = segments[collectionsIndex + 2]
      }
    }
    return { collectionSlug, docId }
  }, [])

  // Pre-fetch suggestions on mount
  React.useEffect(() => {
    const fetchSuggestions = async () => {
      const { collectionSlug, docId } = getDocInfo()
      if (!collectionSlug) {
        return
      }

      const triggers = ['@', '#']
      const newSuggestions: Record<string, any[]> = {}

      await Promise.all(
        triggers.map(async (trigger) => {
          const params = new URLSearchParams({
            id: docId,
            collection: collectionSlug,
            q: '', // Fetch all
            trigger,
          })

          try {
            const response = await fetch(`/api/prompt-mentions?${params.toString()}`)
            if (response.ok) {
              const data = await response.json()
              newSuggestions[trigger] = data.items.map((item: any) => ({
                ...item,
                value: item.id || item.value,
              }))
            } else {
              newSuggestions[trigger] = []
            }
          } catch (e) {
            console.error(`Failed to fetch suggestions for ${trigger}`, e)
            newSuggestions[trigger] = []
          }
        }),
      )

      suggestionsRef.current = newSuggestions
      setIsLoaded(true)
    }

    fetchSuggestions().catch(console.log)
  }, [getDocInfo])

  const queryMentions = useCallback(async (trigger: string, queryString?: null | string) => {
    const items = suggestionsRef.current[trigger] || []

    if (!queryString) {
      return items as BeautifulMentionsItem[]
    }

    const lowerQuery = queryString.toLowerCase()
    return items.filter((item) => {
      const display = item.display || item.value || ''
      return display.toLowerCase().includes(lowerQuery)
    }) as BeautifulMentionsItem[]
  }, [])

  return (
    <BeautifulMentionsPlugin
      menuComponent={PromptMentionsMenu}
      menuItemComponent={PromptMentionsMenuItem}
      onSearch={queryMentions}
      triggers={['@', '#']}
    />
  )
}

export const PromptMentionsClient = createClientFeature({
  nodes: [BeautifulMentionNode],
  plugins: [
    {
      Component: PromptMentionsPlugin,
      position: 'normal',
    },
  ],
})
