import { withMergedProps } from '@payloadcms/ui/shared'

import { RichTextLabel } from './RichTextLabel.js';

export const AIRichTextLabel = (options: any) => {
  const mergedPropsFunc = withMergedProps({
    Component: RichTextLabel,
    sanitizeServerOnlyProps: true,
    toMergeIntoProps: options,
  })

  // TODO: Might use this in order to add field entry for Instructions on plugin Init
  mergedPropsFunc.displayName = 'AITextarea'

  return mergedPropsFunc
}
