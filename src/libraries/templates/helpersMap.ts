type SupportedHelpers = 'toHTML' | 'toText'

interface HelperFieldConfig {
  field: string
  name: string
}

type TemplateHelpers = {
  [K in SupportedHelpers]: HelperFieldConfig
}

export const templateHelpersMap: TemplateHelpers = {
  toHTML: {
    name: 'toHTML',
    field: 'richText',
  },
  toText: {
    name: 'toText',
    field: '-',
  },
}

export const templateHelpers = Object.keys(templateHelpersMap)
