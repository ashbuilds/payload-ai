'use client'

import type {
  BeautifulMentionsItem} from 'lexical-beautiful-mentions';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import { useDocumentInfo, useFormFields, useTranslation } from '@payloadcms/ui'
import {
  BeautifulMentionNode,
  BeautifulMentionsPlugin,
} from 'lexical-beautiful-mentions'
import React, { useCallback } from 'react'

type MentionSuggestion = BeautifulMentionsItem & {
  display?: string
  id?: string
  value?: string
}

const MENTION_SUGGESTIONS_TTL_MS = 60_000
const mentionSuggestionsCache = new Map<string, { expiresAt: number; items: MentionSuggestion[] }>()
const mentionSuggestionsInFlight = new Map<string, Promise<MentionSuggestion[]>>()

const getMentionCacheKey = (collectionSlug: string, trigger: string): string =>
  `${collectionSlug}:${trigger}`

const fetchMentionSuggestions = async (
  collectionSlug: string,
  trigger: string,
): Promise<MentionSuggestion[]> => {
  const cacheKey = getMentionCacheKey(collectionSlug, trigger)
  const now = Date.now()
  const cached = mentionSuggestionsCache.get(cacheKey)

  if (cached && cached.expiresAt > now) {
    return cached.items
  }

  const existingRequest = mentionSuggestionsInFlight.get(cacheKey)
  if (existingRequest) {
    return existingRequest
  }

  const request = (async () => {
    const params = new URLSearchParams({
      collection: collectionSlug,
      q: '',
      trigger,
    })

    try {
      const response = await fetch(`/api/prompt-mentions?${params.toString()}`)
      if (!response.ok) {
        return []
      }

      const data = await response.json()
      const items = (data.items || []).map((item: any) => ({
        ...item,
        value: item.id || item.value,
      })) as MentionSuggestion[]

      mentionSuggestionsCache.set(cacheKey, {
        expiresAt: now + MENTION_SUGGESTIONS_TTL_MS,
        items,
      })

      return items
    } catch (e) {
      console.error(`Failed to fetch suggestions for ${trigger}`, e)
      return []
    } finally {
      mentionSuggestionsInFlight.delete(cacheKey)
    }
  })()

  mentionSuggestionsInFlight.set(cacheKey, request)
  return request
}

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
  const { t } = useTranslation()
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
          {t('ai-plugin:general:loading' as any)}
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
  itemValue: _itemValue,
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
  useLexicalComposerContext()
  const suggestionsRef = React.useRef<Record<string, MentionSuggestion[]>>({})

  // Get schema-path from the form to determine the target collection (Instructions context)
  const schemaPathField = useFormFields(([fields]: any) => fields['schema-path'])
  const schemaPath = schemaPathField?.value as string

  // Get current document info (Regular Collection context)
  const { collectionSlug: currentCollectionSlug } = useDocumentInfo()

  // Determine effective collection slug
  // 1. If schemaPath exists (Instructions), derive slug from it (e.g. "products.name" -> "products")
  // 2. Fallback to current collection slug (e.g. editing a Product directly)
  const collectionSlug = schemaPath ? schemaPath.split('.')[0] : currentCollectionSlug

  // Pre-fetch suggestions when collectionSlug changes
  React.useEffect(() => {
    const fetchSuggestions = async () => {
      if (!collectionSlug) {
        return
      }

      const triggers = ['@', '#']
      const newSuggestions: Record<string, any[]> = {}

      await Promise.all(
        triggers.map(async (trigger) => {
          newSuggestions[trigger] = await fetchMentionSuggestions(collectionSlug, trigger)
        }),
      )

      suggestionsRef.current = newSuggestions
    }

    fetchSuggestions().catch(console.error)
  }, [collectionSlug])

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
