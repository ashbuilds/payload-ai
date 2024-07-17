import { withMergedProps } from '@payloadcms/ui/shared'

import { SmartLabelComponent } from './SmartLabelComponent.js';

export const SmartLabel = (options: any) => {
  const mergedPropsFunc = withMergedProps({
    Component: SmartLabelComponent,
    sanitizeServerOnlyProps: true,
    toMergeIntoProps: options,
  })

  // TODO: Might use this in order to add field entry for Instructions on plugin Init
  mergedPropsFunc.displayName = 'SmartLabel'

  return mergedPropsFunc
}
