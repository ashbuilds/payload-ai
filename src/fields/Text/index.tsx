import { withMergedProps } from '@payloadcms/ui/shared'

import { TextComponent } from './TextComponent.js';

export const AIText = (options: any) => {
  const mergedPropsFunc = withMergedProps({
    Component: TextComponent,
    sanitizeServerOnlyProps: true,
    toMergeIntoProps: options,
  })

  // TODO: Might use this in order to add field entry for Instructions on plugin Init
  mergedPropsFunc.displayName = 'AIText'

  return mergedPropsFunc
}
