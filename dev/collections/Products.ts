import type { CollectionConfig } from 'payload'

import { PayloadAiPluginLexicalEditorFeature, PromptField } from '@ai-stack/payloadcms'
import {
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { anyone } from '../access/anyone.js'

export const Products: CollectionConfig = {
  slug: 'products',
  access: {
    create: anyone,
    delete: anyone,
    read: anyone,
    update: anyone,
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      admin: {
        description: 'URL safe identifier used by APIs and the game engine.',
        position: 'sidebar',
      },
      index: true,
      required: true,
      unique: true,
    },
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'The name customers will see for this t-shirt design.',
      },
      label: 'Display name',
      localized: true,
      required: true,
    },
    {
      type: 'group',
      fields: [
        PromptField({
          name: 'description',
          admin: {
            description: 'A bold retro tiger with “Stay Wild” typography.',
          },
          label: 'Description',
        }),
        {
          name: 'artwork',
          type: 'upload',
          custom: {
            ai: {
              alwaysShow: true,
              prompt: [
                'Create a print-ready t-shirt graphic based on the following:',
                'Design name: {{ name }}',
                'Concept: {{ description }}',
                '',
                'Output requirements:',
                '- Centered composition intended for the FRONT of a t-shirt',
                '- Clean silhouette and strong readability from 2 meters away',
                '- High contrast, limited palette (2 to 5 colors max)',
                '- Vector-like crisp edges, minimal noise, no photorealism',
                '- NO mockups, NO t-shirt model, NO background scene',
                '- Plain transparent background (or solid white if transparency is not supported)',
                '- Avoid tiny details and thin lines that will not print well',
                '',
                'Style guidance:',
                '- Prefer bold shapes, screenprint-friendly shading (halftone allowed), and clear hierarchy',
                '- If text is used, integrate it as part of the design and keep it legible',
              ].join('\n'),
            },
          },
          label: '',
          relationTo: 'media',
        },
      ],
      label: 'Artwork',
    },
    {
      name: 'details',
      type: 'richText',
      admin: {
        description:
          'A complete design brief and production notes. Use AI Compose to generate variants, print guidance, and listing copy.',
      },
      custom: {
        ai: {
          prompt: [
            'Create a detailed t-shirt design brief for "{{ name }}" using the concept: "{{ description }}".',
            '',
            'Structure it with headings and bullet points:',
            '1) Creative direction: theme, vibe, and what makes it unique',
            '2) Visual elements: main subject(s), supporting elements, composition notes',
            '3) Typography: recommended phrases (3 options) and font style guidance (no specific paid font names)',
            '4) Color palette: 3 palette options, each as named colors plus approximate HEX codes',
            '5) Printability: line weight guidance, negative space, max colors, halftone suggestions',
            '6) Variations: 5 variant ideas (eg. minimal, bold, vintage, dark-shirt version, no-text version)',
            '7) Store listing copy: title, 2-sentence description, and 10 SEO tags (comma-separated)',
            '',
            'Rules:',
            '- Keep everything aligned to screen printing and DTG realities',
            '- No copyrighted brands, characters, or logos',
            '- Keep it practical and production-ready',
          ].join('\n'),
          system: [
            'You are an expert apparel graphic designer and print production lead.',
            'You write concise, practical briefs optimized for screenprint and DTG.',
            'You avoid copyrighted IP and focus on original, printable designs.',
          ].join('\n'),
        },
      },
      editor: lexicalEditor({
        features: ({ defaultFeatures, rootFeatures }) => {
          return [
            ...rootFeatures,
            FixedToolbarFeature(),
            InlineToolbarFeature(),
            ...defaultFeatures,
            HeadingFeature({
              enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            }),
            EXPERIMENTAL_TableFeature(),
            PayloadAiPluginLexicalEditorFeature(),
          ]
        },
      }),
      label: 'Design brief',
    },
  ],
}
