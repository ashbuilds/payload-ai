
import type { CollectionConfig } from 'payload'

import { PayloadAiPluginLexicalEditorFeature } from '@ai-stack/payloadcms'
import {
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
 lexicalEditor } from '@payloadcms/richtext-lexical'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin:{
        position: "sidebar"
      },
      required: true
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures, rootFeatures }) => {
          return [
            ...rootFeatures,
            // Toolbars
            FixedToolbarFeature(),     // persistent toolbar on top
            InlineToolbarFeature(),    // selection (floating) toolbar

            // All defaults
            ...defaultFeatures,

            // Make sure all heading sizes are available
            HeadingFeature({ enabledHeadingSizes: ['h1','h2','h3','h4','h5','h6'] }),

            // Optional / non-default features
            EXPERIMENTAL_TableFeature(), // tables (experimental)
            // TextStateFeature({
            //   // enables inline styles like color sets / “text state”
            //   state: {
            //     color: { ...defaultColors },
            //   },
            // }),
            // BlocksFeature(),           // enable Blocks inside the editor (pass your blocks if you have them)
            // TreeViewFeature(),         // dev-only: state inspector under the editor

            PayloadAiPluginLexicalEditorFeature(),
          ]
        },
      }),
    },
  ],
  versions: {
    drafts: {
      autosave: true,
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
