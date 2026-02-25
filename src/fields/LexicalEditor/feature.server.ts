import { createServerFeature } from '@payloadcms/richtext-lexical'

import { PLUGIN_LEXICAL_EDITOR_FEATURE } from '../../defaults.js'

// TODO: Find a way to check if the plugin is activated
export const PayloadAiPluginLexicalEditorFeature = createServerFeature({
  feature: {
    ClientFeature: '@ai-stack/payloadcms/fields/LexicalEditor/feature.client.js#LexicalEditorFeatureClient',
  },
  key: PLUGIN_LEXICAL_EDITOR_FEATURE,
})
