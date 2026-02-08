import type { Block, CollectionConfig } from 'payload'

import { PayloadAiPluginLexicalEditorFeature } from '@ai-stack/payloadcms'
import {
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { anyone } from '../access/anyone.js'

export const Banner: Block = {
  slug: 'banner',
  fields: [
    {
      name: 'style',
      type: 'select',
      defaultValue: 'info',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Warning', value: 'warning' },
        { label: 'Error', value: 'error' },
        { label: 'Success', value: 'success' },
      ],
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
      label: false,
      required: true,
    },
  ],
  interfaceName: 'BannerBlock',
}

export const MediaBlock: Block = {
  slug: 'mediaBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
  ],
  interfaceName: 'MediaBlock',
}

export const Code: Block = {
  slug: 'code',
  fields: [
    {
      name: 'language',
      type: 'select',
      defaultValue: 'typescript',
      options: [
        {
          label: 'Typescript',
          value: 'typescript',
        },
        {
          label: 'Javascript',
          value: 'javascript',
        },
        {
          label: 'CSS',
          value: 'css',
        },
      ],
    },
    {
      name: 'code',
      type: 'code',
      label: false,
      required: true,
    },
  ],
  interfaceName: 'CodeBlock',
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    read: anyone,
  },
  admin: {
    // Keep using the top-level `title` field (it sits inside a Tab but not inside a Group),
    // so the path remains simply "title"
    useAsTitle: 'title',
  },
  fields: [
    {
      // Use tabs to clearly separate feature demos and make the config self-documenting
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'title',
              type: 'text',
              admin: {
                description:
                  'Demonstrates AI title generation. Use the AI plugin’s Compose action on this field to generate or iterate on a compelling, SEO-friendly headline.',
              },
              label: 'Title',
              required: true,
            },
            {
              name: 'keywords',
              type: 'text',
              // Description of the field is passed to ai model
              admin: { description: `SEO quality keywords` },
              hasMany: true,
              label: 'keywords',
              maxRows: 5,
              required: false,
            },
            {
              name: 'number',
              type: 'number',
              admin: {
                description: 'Any random number 1-10',
              },
              hasMany: true,
            },
            {
              name: 'select',
              type: 'select',
              options: ['gpt-4o-mini', 'gpt-4', 'gpt-5'],
            },
            {
              name: 'description',
              type: 'textarea',
            },
          ],
          label: 'AI Title',
        },
        {
          fields: [
            {
              name: 'bannerInputs',
              type: 'group',
              admin: {
                description:
                  'Upload the source images used by the banner prompt template. The AI composes these into a single hero/banner image.',
              },
              fields: [
                {
                  name: 'shirt',
                  type: 'upload',
                  label: 'Shirt',
                  relationTo: 'media',
                },
                {
                  name: 'pants',
                  type: 'upload',
                  label: 'Pants',
                  relationTo: 'media',
                },
                {
                  name: 'person',
                  type: 'upload',
                  label: 'Person',
                  relationTo: 'media',
                },
                {
                  name: 'background',
                  type: 'upload',
                  label: 'Background',
                  relationTo: 'media',
                },
              ],
              label: 'Banner Inputs',
            },
            {
              name: 'bannerOutput',
              type: 'group',
              admin: {
                description:
                  'Result of the AI banner generation (typically using OpenAI GPT-Image-1). Use the Compose action to generate and iterate on the final image.',
              },
              fields: [
                {
                  name: 'heroImage',
                  type: 'upload',
                  label: 'Hero Image',
                  relationTo: 'media',
                },
              ],
              label: 'Banner Output',
            },
          ],
          label: 'AI Banner (GPT-Image-1)',
        },
        {
          fields: [
            {
              name: 'articleBody',
              type: 'group',
              admin: {
                description:
                  'Rich text powered by Lexical with AI assistance. Use toolbars and the Compose menu to generate, refine, format, and translate content.',
              },
              fields: [
                {
                  name: 'content',
                  type: 'richText',
                  editor: lexicalEditor({
                    features: ({ rootFeatures }) => {
                      return [
                        // ...rootFeatures,
                        // HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                        BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
                        FixedToolbarFeature(),
                        InlineToolbarFeature(),
                        HorizontalRuleFeature(),
                        EXPERIMENTAL_TableFeature(),

                        // AI feature for Lexical editor
                        PayloadAiPluginLexicalEditorFeature(),
                      ]
                    },
                  }),
                  // editor: lexicalEditor({
                  //   features: ({ defaultFeatures, rootFeatures }) => {
                  //     return [
                  //       ...rootFeatures,
                  //       // Toolbars
                  //       FixedToolbarFeature(), // persistent toolbar on top
                  //       InlineToolbarFeature(), // selection (floating) toolbar
                  //
                  //       // All defaults
                  //       ...defaultFeatures,
                  //
                  //       // Make sure all heading sizes are available
                  //       HeadingFeature({
                  //         enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                  //       }),
                  //
                  //       // Optional / non-default features
                  //       EXPERIMENTAL_TableFeature(), // tables (experimental)
                  //
                  //       // AI feature for Lexical editor
                  //       PayloadAiPluginLexicalEditorFeature(),
                  //     ]
                  //   },
                  // }),
                },
              ],
              label: 'Article Body',
            },
          ],
          label: 'AI Content (Rich Text)',
        },
        {
          fields: [
            {
              name: 'voice',
              type: 'group',
              admin: {
                description:
                  'Generates narration for the Content field. Only the audio file is stored here; model and generation options are configured in the AI plugin settings.',
              },
              fields: [
                {
                  name: 'audio',
                  type: 'upload',
                  label: 'Voice Audio',
                  relationTo: 'media',
                },
              ],
              label: 'Voice Generation',
            },
          ],
          label: 'AI Voice-Over',
        },
      ],
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
