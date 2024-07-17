import { withMergedProps } from '@payloadcms/ui/shared'

import { TextareaComponent } from './TextareaComponent.js';

export const AITextarea = (options: any) => {
  const mergedPropsFunc = withMergedProps({
    Component: TextareaComponent,
    sanitizeServerOnlyProps: true,
    toMergeIntoProps: options,
  })

  // TODO: Might use this in order to add field entry for Instructions on plugin Init
  mergedPropsFunc.displayName = 'AITextarea'

  return mergedPropsFunc
}
