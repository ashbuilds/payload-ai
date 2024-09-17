import { createServerFeature } from '@payloadcms/richtext-lexical'

import { PLUGIN_LEXICAL_EDITOR_FEATURE } from '../../defaults.js'
import { isPluginActivated } from '../../utilities/isPluginActivated.js'

const isActivated = isPluginActivated()

export const PayloadAiPluginLexicalEditorFeature = createServerFeature({
  feature: {
    ClientFeature: isActivated ? '@ai-stack/payloadcms/client#LexicalEditorFeatureClient' : null,
  },
  key: PLUGIN_LEXICAL_EDITOR_FEATURE,
})
