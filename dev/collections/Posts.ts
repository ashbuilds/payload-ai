import type { CollectionConfig } from 'payload'

import { PayloadAiPluginLexicalEditorFeature } from '@ai-stack/payloadcms'
import {
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    read: () => true,
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
          label: 'AI Title',
          fields: [
            {
              name: 'title',
              label: 'Title',
              type: 'text',
              required: true,
              admin: {
                description:
                  'Demonstrates AI title generation. Use the AI plugin’s Compose action on this field to generate or iterate on a compelling, SEO-friendly headline.',
              },
            },
          ],
        },
        {
          label: 'AI Banner (GPT-Image-1)',
          fields: [
            {
              type: 'group',
              name: 'bannerInputs',
              label: 'Banner Inputs',
              admin: {
                description:
                  'Upload the source images used by the banner prompt template. The AI composes these into a single hero/banner image.',
              },
              fields: [
                {
                  name: 'shirt',
                  label: 'Shirt',
                  type: 'upload',
                  relationTo: 'media',
                },
                {
                  name: 'pants',
                  label: 'Pants',
                  type: 'upload',
                  relationTo: 'media',
                },
                {
                  name: 'person',
                  label: 'Person',
                  type: 'upload',
                  relationTo: 'media',
                },
                {
                  name: 'background',
                  label: 'Background',
                  type: 'upload',
                  relationTo: 'media',
                },
              ],
            },
            {
              type: 'group',
              name: 'bannerOutput',
              label: 'Banner Output',
              admin: {
                description:
                  'Result of the AI banner generation (typically using OpenAI GPT-Image-1). Use the Compose action to generate and iterate on the final image.',
              },
              fields: [
                {
                  name: 'heroImage',
                  label: 'Hero Image',
                  type: 'upload',
                  relationTo: 'media',
                },
              ],
            },
          ],
        },
        {
          label: 'AI Content (Rich Text)',
          fields: [
            {
              type: 'group',
              name: 'articleBody',
              label: 'Article Body',
              admin: {
                description:
                  'Rich text powered by Lexical with AI assistance. Use toolbars and the Compose menu to generate, refine, format, and translate content.',
              },
              fields: [
                {
                  name: 'content',
                  type: 'richText',
                  editor: lexicalEditor({
                    features: ({ defaultFeatures, rootFeatures }) => {
                      return [
                        ...rootFeatures,
                        // Toolbars
                        FixedToolbarFeature(), // persistent toolbar on top
                        InlineToolbarFeature(), // selection (floating) toolbar

                        // All defaults
                        ...defaultFeatures,

                        // Make sure all heading sizes are available
                        HeadingFeature({
                          enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
                        }),

                        // Optional / non-default features
                        EXPERIMENTAL_TableFeature(), // tables (experimental)

                        // AI feature for Lexical editor
                        PayloadAiPluginLexicalEditorFeature(),
                      ]
                    },
                  }),
                },
              ],
            },
          ],
        },
        {
          label: 'AI Voice-Over',
          fields: [
            {
              type: 'group',
              name: 'voice',
              label: 'Voice Generation',
              admin: {
                description:
                  'Generates narration for the Content field. Only the audio file is stored here; model and generation options are configured in the AI plugin settings.',
              },
              fields: [
                {
                  name: 'audio',
                  label: 'Voice Audio',
                  type: 'upload',
                  relationTo: 'media',
                },
              ],
            },
          ],
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
