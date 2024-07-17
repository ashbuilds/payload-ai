import { withMergedProps } from '@payloadcms/ui/shared'

import { UploadComponent } from './UploadComponent.js';

export const AIUpload = (options: any) => {
  const mergedPropsFunc = withMergedProps({
    Component: UploadComponent,
    sanitizeServerOnlyProps: true,
    toMergeIntoProps: options,
  })

  // TODO: Might use this in order to add field entry for Instructions on plugin Init
  mergedPropsFunc.displayName = 'AITextarea'

  return mergedPropsFunc
}
