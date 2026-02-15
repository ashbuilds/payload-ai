'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { createClientFeature } from '@payloadcms/richtext-lexical/client'
import {
  BeautifulMentionNode,
  BeautifulMentionsPlugin,
  BeautifulMentionsTheme,
} from 'lexical-beautiful-mentions'
import React, { useCallback } from 'react'

const PromptMentionsPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext()

  const queryMentions = useCallback(async (trigger: string, queryString?: string, id?: string) => {
    // Retrieve collection slug from window location or context if possible using a hook,
    // but here we are in a plugin.
    // We can parse window.location similar to previous PromptEditorField
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

    const params = new URLSearchParams({
      id: docId,
      collection: collectionSlug,
      q: queryString || '',
      trigger,
    })

    const response = await fetch(`/api/prompt-mentions?${params.toString()}`)
    if (!response.ok) {
      return []
    }
    const data = await response.json()
    return data.items.map((item: any) => ({
      ...item,
      value: item.id || item.value,
    }))
  }, [])


  return (
    <BeautifulMentionsPlugin
      menuComponent={undefined} // Use default menu for now, can customize later
      menuItemComponent={undefined}
      // @ts-ignore
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
