import type { Field, RichTextField } from 'payload'

import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { PromptMentionsFeature } from './PromptEditorField/feature.server.js'

type PromptFieldOverrides = Partial<RichTextField>

export const PromptField = (overrides: PromptFieldOverrides = {}): Field => {
  return {
    name: 'prompt',
    type: 'richText',
    label: 'Prompt',
    ...overrides,
    editor:
      overrides.editor ??
      lexicalEditor({
        features: ({ rootFeatures }) => [
          // ...rootFeatures,
          PromptMentionsFeature(),
        ],
      }),
  }
}
