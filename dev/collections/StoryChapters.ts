import type { CollectionConfig } from 'payload'

import { PayloadAiPluginLexicalEditorFeature } from '@ai-stack/payloadcms'
import {
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { orgCreateAccess, orgDeleteAccess, orgReadAccess, orgUpdateAccess } from '../access/org.js'

/**
 * StoryChapters represent structured segments of a story.
 * AI-enabled fields: title (text), summary (text), content (richText with AI feature).
 */
export const StoryChapters: CollectionConfig = {
  slug: 'story-chapters',
  access: {
    create: orgCreateAccess,
    delete: orgDeleteAccess,
    read: orgReadAccess,
    update: orgUpdateAccess,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'organization',
      type: 'relationship',
      admin: {
        description: 'Owning organization. Access is scoped by this value.',
      },
      label: 'Organization',
      relationTo: 'organizations',
      required: true,
    },
    {
      name: 'story',
      type: 'relationship',
      admin: {
        description: 'Parent story for this chapter.',
      },
      label: 'Story',
      relationTo: 'stories',
      required: true,
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        description: 'Integer index indicating chapter order within the story.',
      },
      label: 'Order',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Short chapter title. Use AI Compose to ideate concise titles.',
      },
      label: 'Title',
      required: true,
    },
    {
      name: 'summary',
      type: 'text',
      admin: {
        description:
          'Short recap of the chapter. Use AI Compose to quickly draft an overview.',
      },
      label: 'Summary',
    },
    {
      name: 'content',
      type: 'richText',
      admin: {
        description:
          'Narrative content. Rich text supports headings, lists, and inline images. AI Compose is enabled.',
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures, rootFeatures }) => {
          return [
            ...rootFeatures,
            FixedToolbarFeature(),
            InlineToolbarFeature(),
            ...defaultFeatures,
            HeadingFeature({
              enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            }),
            EXPERIMENTAL_TableFeature(),
            PayloadAiPluginLexicalEditorFeature(),
          ]
        },
      }),
      label: 'Content',
    },
    {
      name: 'estimatedDurationMinutes',
      type: 'number',
      admin: {
        description: 'For planning and scheduling game sessions.',
      },
      label: 'Estimated Duration (minutes)',
    },
    {
      name: 'meta',
      type: 'json',
      admin: {
        description: 'Optional engine-specific data for this chapter.',
      },
      label: 'Meta',
    },
  ],
  versions: {
    maxPerDoc: 50,
  },
}


