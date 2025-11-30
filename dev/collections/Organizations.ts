import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated.js'

/**
 * Minimal Organizations collection to back org-scoped relations.
 * Extend with additional fields/roles later as needed.
 */
export const Organizations: CollectionConfig = {
  slug: 'organizations',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    description:
      'Organizations are used to scope Storytelling content. Users associated with an organization can only access their own org data.',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: {
        description: 'Unique identifier for the organization (used in URLs and references).',
      },
    },
  ],
  versions: {
    maxPerDoc: 25,
  },
}

export default Organizations
