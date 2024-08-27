import { createServerFeature } from '@payloadcms/richtext-lexical'

import { PLUGIN_LEXICAL_EDITOR_FEATURE } from '../../defaults.js'
import { isPluginActivated } from '../../utilities/isPluginActivated.js'
import { LexicalEditorFeatureClient } from './feature.client.js'

export const PayloadAiPluginLexicalEditorFeature = createServerFeature({
  feature: ({ props }: Record<any, any>) => {
    const sanitizedProps = {
      applyToFocusedEditor:
        props?.applyToFocusedEditor === undefined ? false : props.applyToFocusedEditor,
      disableIfParentHasFixedToolbar:
        props?.disableIfParentHasFixedToolbar === undefined
          ? false
          : props.disableIfParentHasFixedToolbar,
    }
    return {
      ClientFeature: isPluginActivated() ? LexicalEditorFeatureClient : null,
      clientFeatureProps: sanitizedProps,
      sanitizedServerFeatureProps: sanitizedProps,
    }
  },
  key: PLUGIN_LEXICAL_EDITOR_FEATURE,
})
