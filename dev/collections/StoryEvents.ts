import type { CollectionConfig } from 'payload'

import { orgCreateAccess, orgReadAccess } from '../access/org.js'

/**
 * StoryEvents (analytics stub): future-proofed schema for tracking gameplay/UX events.
 * No AI integration here. Keep immutable by default (no updates/deletes).
 */
export const StoryEvents: CollectionConfig = {
  slug: 'story-events',
  access: {
    // Allow authenticated org users to create events; orgCreateAccess enforces org consistency when provided
    create: orgCreateAccess,
    // Read restricted to authenticated users and scoped by organization
    read: orgReadAccess,
    // Disallow ad-hoc modifications to historical analytics by default
    delete: () => false,
    update: () => false,
  },
  admin: {
    description:
      'Analytics and telemetry events for stories. Designed for internal tools and dashboards.',
    useAsTitle: 'eventType',
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
      label: 'Story',
      relationTo: 'stories',
      required: true,
    },
    {
      name: 'chapter',
      type: 'relationship',
      label: 'Chapter',
      relationTo: 'story-chapters',
      required: false,
    },
    {
      name: 'npc',
      type: 'relationship',
      label: 'NPC',
      relationTo: 'npcs',
      required: false,
    },
    {
      name: 'eventType',
      type: 'text',
      admin: {
        description:
          'Example values: story_intro_viewed, story_intro_skipped, npc_interaction, chapter_completed, drop_off',
      },
      label: 'Event Type',
      required: true,
    },
    {
      name: 'payload',
      type: 'json',
      admin: {
        description: 'Arbitrary event data (shape defined by your game engine/services).',
      },
      label: 'Payload',
    },
  ],
}


