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

const NPC_ROLES = ['guide', 'rival', 'historian', 'narrator', 'other'] as const
export type NpcRole = (typeof NPC_ROLES)[number]

/**
 * NPCs are reusable characters that can appear across multiple stories and hunts.
 * AI-enabled fields: name (text), bio (richText).
 */
export const NPCs: CollectionConfig = {
  slug: 'npcs',
  access: {
    create: orgCreateAccess,
    delete: orgDeleteAccess,
    read: orgReadAccess,
    update: orgUpdateAccess,
  },
  admin: {
    useAsTitle: 'name',
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
      name: 'name',
      type: 'text',
      admin: {
        description:
          'NPC display name. Use AI Compose to brainstorm distinct, memorable names that fit the role and tone.',
      },
      label: 'Name',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        description: 'Unique identifier for the NPC (used by content pipelines or engine keys).',
      },
      label: 'Slug',
      required: true,
      unique: true,
    },
    {
      name: 'role',
      type: 'select',
      admin: {
        description:
          'The primary narrative function of this character. Prompts can reference this to guide generation.',
      },
      defaultValue: 'guide',
      label: 'Role',
      options: NPC_ROLES.map((v) => ({ label: v, value: v })),
      required: true,
    },
    {
      name: 'portrait',
      type: 'upload',
      admin: {
        description: '2D portrait image used for UI/dialogue.',
      },
      label: 'Portrait',
      relationTo: 'media',
    },
    {
      name: 'model3D',
      type: 'upload',
      admin: {
        description:
          'Optional 3D model reference. Can be replaced with a dedicated assets collection later.',
      },
      label: '3D Model',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'bio',
      type: 'richText',
      admin: {
        description:
          'A longer biography/personality profile. Use AI Compose to generate consistent backstory and voice.',
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
      label: 'Bio',
    },
    {
      name: 'linkedStories',
      type: 'relationship',
      admin: {
        description: 'Stories this NPC appears in (many-to-many).',
      },
      hasMany: true,
      label: 'Linked Stories',
      relationTo: 'stories',
    },
    {
      name: 'reusableAcrossHunts',
      type: 'checkbox',
      admin: {
        description:
          'Mark as a library NPC that can be reused across experiences for the same organization.',
      },
      defaultValue: false,
      label: 'Reusable Across Hunts',
    },
    {
      name: 'meta',
      type: 'json',
      admin: {
        description:
          'Optional engine metadata (dialogue IDs, voice actor ID, behavior flags, etc).',
      },
      label: 'Meta',
    },
  ],
  versions: {
    maxPerDoc: 50,
  },
}
