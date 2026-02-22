import type { Field } from 'payload'

import { allProviderBlocks } from '../../ai/providers/blocks/index.js'

type BuildProviderOptionsArrayFieldsArgs = {
  descriptionForProvider?: (label: string) => string
  hidden?: boolean
  label?: string
}

const providerOptionsRowFields: Field[] = [
  {
    name: 'key',
    type: 'text',
    label: 'Option Key',
    required: true,
  },
  {
    type: 'row',
    fields: [
      {
        name: 'type',
        type: 'select',
        admin: {
          width: '30%',
        },
        dbName: 'opt_type',
        defaultValue: 'text',
        label: 'Value Type',
        options: [
          { label: 'Text', value: 'text' },
          { label: 'Number', value: 'number' },
          { label: 'Boolean', value: 'boolean' },
          { label: 'Options', value: 'options' },
        ],
        required: true,
      },
      {
        name: 'valueText',
        type: 'text',
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'text',
          width: '70%',
        },
        label: 'Text',
      },
      {
        name: 'valueNumber',
        type: 'number',
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'number',
          width: '70%',
        },
        label: 'Number',
      },
      {
        name: 'valueBoolean',
        type: 'checkbox',
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'boolean',
          description: 'Select default state or leave empty',
          style: { marginTop: '26px' },
          width: '70%',
        },
        label: 'Enabled',
      },
      {
        name: 'valueOptions',
        type: 'text',
        admin: {
          condition: (_, siblingData) => siblingData?.type === 'options',
          description: 'Enter space separated text values',
          width: '70%',
        },
        hasMany: true,
        label: 'Options',
      },
    ],
  },
]

export const buildProviderOptionsArrayFields = (
  args?: BuildProviderOptionsArrayFieldsArgs,
): Field[] => {
  return allProviderBlocks.map((block) => {
    const label =
      typeof block.labels?.singular === 'string' ? block.labels.singular : String(block.slug)
    const providerKey = String(block.slug).replace(/\W/g, '_')

    return {
      name: `po_${providerKey}`,
      type: 'array',
      admin: {
        condition: (_, siblingData) => siblingData?.provider === block.slug,
        description: args?.descriptionForProvider?.(label) || `Add custom options to pass to ${label}.`,
        hidden: args?.hidden,
        initCollapsed: false,
      },
      fields: providerOptionsRowFields,
      label: args?.label || 'Provider Options',
    } satisfies Field
  })
}
