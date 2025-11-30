import type { CollectionConfig } from 'payload'

import { orgCreateAccess, orgDeleteAccess, orgReadAccess, orgUpdateAccess } from '../access/org.js'

const STORY_STATUS = ['draft', 'active', 'archived'] as const
export type StoryStatus = (typeof STORY_STATUS)[number]

/**
 * Stories define a playable quest within a universe. Scoped by organization.
 * AI-enabled fields: title (text), summary (textarea), objective (textarea).
 */
export const Stories: CollectionConfig = {
  slug: 'stories',
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
      name: 'universe',
      type: 'relationship',
      admin: {
        description: 'Optional universe this story belongs to (Episode 1, 2, etc).',
      },
      label: 'Universe',
      relationTo: 'story-universes',
      required: false,
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        description: 'Unique key for URLs and game engine references.',
      },
      label: 'Slug',
      required: true,
      unique: true,
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Short story title. Use AI Compose to ideate options.',
      },
      label: 'Title',
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        description:
          'Short abstract explaining the story in a nutshell. AI Compose is enabled to draft this quickly.',
      },
      label: 'Summary',
    },
    {
      name: 'objective',
      type: 'textarea',
      admin: {
        description:
          'High-level quest description for players. AI Compose can propose clear, actionable goals.',
      },
      label: 'Objective',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      label: 'Status',
      options: STORY_STATUS.map((v) => ({ label: v, value: v })),
      required: true,
    },
    {
      name: 'chapters',
      type: 'relationship',
      admin: {
        description:
          'Ordered list of chapters in this story. Create chapters and link them here or from the chapter itself.',
      },
      hasMany: true,
      label: 'Chapters',
      relationTo: 'story-chapters',
    },
    {
      name: 'tags',
      type: 'text',
      admin: {
        description: 'Optional internal classification labels.',
      },
      hasMany: true,
      label: 'Tags',
    },
    {
      name: 'meta',
      type: 'json',
      admin: {
        description: 'Optional engine-specific metadata.',
      },
      label: 'Meta',
    },
  ],
  versions: {
    drafts: {
      autosave: true,
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}

export default Stories
