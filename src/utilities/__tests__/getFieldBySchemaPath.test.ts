import type { CollectionConfig } from 'payload'

import { describe, expect, it } from 'vitest'

import { getFieldBySchemaPath } from '../getFieldBySchemaPath.js'

// Minimal fixture - only the shape `getFieldBySchemaPath` actually reads (slug + fields).
const collectionConfig = {
  slug: 'pages',
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      // Unnamed row: layout-only, should not contribute a path segment.
      type: 'row',
      fields: [
        { name: 'customId', type: 'text' },
        { name: 'customClass', type: 'text' },
      ],
    },
    {
      // Unnamed collapsible: same as row, no name, should be transparent too.
      type: 'collapsible',
      fields: [{ name: 'advancedNote', type: 'textarea' }],
      label: 'Advanced',
    },
    {
      // Named group: already worked before this fix, must keep working (contributes a segment).
      name: 'route',
      type: 'group',
      fields: [{ name: 'slug', type: 'text' }],
    },
    {
      // Tabs: layout-only, pre-existing behavior, must keep working.
      type: 'tabs',
      tabs: [
        {
          fields: [{ name: 'seoTitle', type: 'text' }],
        },
      ],
    },
  ],
} as unknown as CollectionConfig

// `Field` is a big union and several variants (row, collapsible, tabs, UI) don't have `name`
// at all - casting to `any` here mirrors how getFieldBySchemaPath.ts itself accesses `.name`.
const nameOf = (field: ReturnType<typeof getFieldBySchemaPath>): unknown => (field as any)?.name

describe('getFieldBySchemaPath', () => {
  it('finds a top-level field', () => {
    const field = getFieldBySchemaPath(collectionConfig, 'pages.title')
    expect(nameOf(field)).toBe('title')
  })

  it('finds a field nested in an unnamed row (no path segment consumed)', () => {
    const field = getFieldBySchemaPath(collectionConfig, 'pages.customId')
    expect(nameOf(field)).toBe('customId')
  })

  it('finds a second field nested in the same unnamed row', () => {
    const field = getFieldBySchemaPath(collectionConfig, 'pages.customClass')
    expect(nameOf(field)).toBe('customClass')
  })

  it('finds a field nested in an unnamed collapsible (no path segment consumed)', () => {
    const field = getFieldBySchemaPath(collectionConfig, 'pages.advancedNote')
    expect(nameOf(field)).toBe('advancedNote')
  })

  it('still finds a field nested in a named group (contributes its own path segment)', () => {
    const field = getFieldBySchemaPath(collectionConfig, 'pages.route.slug')
    expect(nameOf(field)).toBe('slug')
  })

  it('still finds a field nested in tabs (no path segment consumed)', () => {
    const field = getFieldBySchemaPath(collectionConfig, 'pages.seoTitle')
    expect(nameOf(field)).toBe('seoTitle')
  })

  it('returns null for an unknown path', () => {
    const field = getFieldBySchemaPath(collectionConfig, 'pages.doesNotExist')
    expect(field).toBeNull()
  })
})
