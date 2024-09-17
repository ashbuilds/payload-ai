'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'

import { ComposeFeatureComponent } from './ComposeFeatureComponent.js'

export const LexicalEditorFeatureClient = createClientFeature({
  plugins: [
    {
      Component: ComposeFeatureComponent,
      position: 'belowContainer',
    },
  ],
})
