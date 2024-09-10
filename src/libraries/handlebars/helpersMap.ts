type SupportedHelpers = 'toHTML' | 'toText'

interface HelperFieldConfig {
  field: string
  name: string
}

type HandlebarsHelpers = {
  [K in SupportedHelpers]: HelperFieldConfig
}

export const handlebarsHelpersMap: HandlebarsHelpers = {
  toHTML: {
    name: 'toHTML',
    field: 'richText',
  },
  toText: {
    name: 'toText',
    field: '-',
  },
}

export const handlebarsHelpers = Object.keys(handlebarsHelpersMap)
