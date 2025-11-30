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

const NODE_TYPES = ['narration', 'choice', 'condition', 'ending'] as const
export type StoryNodeType = (typeof NODE_TYPES)[number]

/**
 * StoryNodes: future-friendly branching narrative schema.
 * Keep this purely data-level; engines will interpret it at runtime.
 * AI-enabled fields: title (text), text (richText), choiceLabel (text, optional).
 */
export const StoryNodes: CollectionConfig = {
  slug: 'story-nodes',
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
        description: 'Story this node belongs to.',
      },
      label: 'Story',
      relationTo: 'stories',
      required: true,
    },
    {
      name: 'chapter',
      type: 'relationship',
      admin: {
        description:
          'Optional chapter association; lets engines map nodes to linear content when needed.',
      },
      label: 'Chapter',
      relationTo: 'story-chapters',
      required: false,
    },
    {
      name: 'parentNode',
      type: 'relationship',
      admin: {
        description: 'Self-reference to parent; enables tree-like structures.',
      },
      label: 'Parent Node',
      relationTo: 'story-nodes',
      required: false,
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        description: 'Ordering among sibling nodes for deterministic traversal.',
      },
      label: 'Order',
    },
    {
      name: 'nodeType',
      type: 'select',
      admin: {
        description:
          'Controls how the engine treats this node (narration, choice, condition, or ending).',
      },
      defaultValue: 'narration',
      label: 'Node Type',
      options: NODE_TYPES.map((v) => ({ label: v, value: v })),
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Short node title; useful for editors and visual graphs. AI Compose enabled.',
      },
      label: 'Title',
    },
    {
      name: 'text',
      type: 'richText',
      admin: {
        description:
          'Narrative shown to the player. Rich text with AI Compose to draft/iterate fast.',
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
      label: 'Text',
    },
    {
      name: 'choiceLabel',
      type: 'text',
      admin: {
        description:
          'Optional short label shown in UI when nodeType is "choice". AI can suggest succinct options.',
      },
      label: 'Choice Label',
      required: false,
    },
    {
      name: 'conditionExpression',
      type: 'json',
      admin: {
        description:
          'Optional JSON used by the game engine to decide transitions (e.g., flags/variables checks).',
      },
      label: 'Condition Expression',
      required: false,
    },
    {
      name: 'nextNodes',
      type: 'relationship',
      admin: {
        description: 'Outgoing edges for this node (branching).',
      },
      hasMany: true,
      label: 'Next Nodes',
      relationTo: 'story-nodes',
    },
    {
      name: 'meta',
      type: 'json',
      admin: {
        description: 'Optional engine-specific data for this node.',
      },
      label: 'Meta',
    },
  ],
  versions: {
    maxPerDoc: 50,
  },
}
