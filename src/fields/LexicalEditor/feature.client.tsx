'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'

import { ComposeFeatureComponent } from './ComposeFeatureComponent.js'

export const LexicalEditorFeatureClient = createClientFeature((props) => {
  return {
    plugins: [
      {
        Component: ComposeFeatureComponent,
        position: 'belowContainer',
      },
    ],
    sanitizedClientFeatureProps: {
      field: props.field,
      path: props.field?.name,
      schemaPath: props.schemaPath,
      ...props?.props,
    },
  }
})
