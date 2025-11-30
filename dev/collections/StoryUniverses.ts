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
 * High-level universe that can span multiple stories / hunts.
 * AI-enabled fields: title (text), summary (richText).
 */
export const StoryUniverses: CollectionConfig = {
  slug: 'story-universes',
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
      name: 'slug',
      type: 'text',
      admin: {
        description: 'Unique key used in URLs and engine references.',
      },
      label: 'Slug',
      required: true,
      unique: true,
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Short universe title. Use AI Compose to ideate and refine.',
      },
      label: 'Title',
      required: true,
    },
    {
      name: 'summary',
      type: 'richText',
      admin: {
        description:
          'Longer background / context for this universe. Rich text with AI Compose enabled.',
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
      label: 'Summary',
    },
    {
      name: 'meta',
      type: 'json',
      admin: {
        description: 'Optional universe-wide flags or engine parameters.',
      },
      label: 'Meta',
    },
  ],
  versions: {
    maxPerDoc: 50,
  },
}
