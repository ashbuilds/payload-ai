import { withMergedProps } from '@payloadcms/ui/shared'

import { DescriptionFieldComponent } from './DescriptionFieldComponent.js'
import { DescriptionComponent } from 'payload'

// @ts-ignore
export const DescriptionField: DescriptionComponent = (options: any) => {
  const mergedPropsFunc = withMergedProps({
    Component: DescriptionFieldComponent,
    sanitizeServerOnlyProps: true,
    toMergeIntoProps: options,
  })

  // TODO: Might use this in order to add field entry for Instructions on plugin Init
  mergedPropsFunc.displayName = 'DescriptionField'

  return mergedPropsFunc
}
