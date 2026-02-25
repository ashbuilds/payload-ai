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
    livePreview: {
      url: ({ data }) => {
        return `http://localhost:3000/products/${data.slug}`
      },
    },
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
          name: 'artworkDescription',
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
              prompt: `{{ #artworkDescription }}
Instructions:
Create print-ready t-shirt graphic based on the following:
Design name: {{ name }}

Output requirements:
- Centered composition
- Clean silhouette and strong readability from 2 meters away
- High contrast, limited palette (2 to 5 colors max)
- Vector-like crisp edges, minimal noise, no photorealism
- NO mockups, NO t-shirt model, NO background scene
- Plain solid background (or  white)
- Avoid tiny details and thin lines that will not print well

Style guidance:
- Prefer bold shapes, screenprint-friendly shading (halftone allowed), and clear hierarchy
- If text is used, integrate it as part of the design and keep it legible`,
            },
          },
          hasMany: true,
          label: '',
          relationTo: 'media',
        },
      ],
      label: 'Artwork',
    },
    {
      type: 'group',
      fields: [
        PromptField({
          name: 'mockupDescription',
          admin: {
            description: 'A lifestyle shot of a model wearing the t-shirt in an urban skatepark.',
          },
          label: 'Description',
        }),
        {
          name: 'mockups',
          type: 'upload',
          custom: {
            ai: {
              alwaysShow: true,
              prompt: `{{ #mockupDescription }}

Composition:
High-quality lifestyle photography shot of a model wearing a t-shirt.
T-Shirt Design(s): @artwork

Output requirements:
- Photorealistic lifestyle photography (editorial / lookbook style)
- A person naturally wearing the t-shirt in the described environment
- Professional lighting, depth of field, and dynamic composition
- The design must look naturally printed on the t-shirt with realistic fabric folds
- NO text overlays, borders, or UI elements
- MUST be a realistic photo of a person in a scene, NOT a flat-lay or a blank template`,
            },
          },
          hasMany: true,
          label: '',
          relationTo: 'media',
        },
      ],
      label: 'Lifestyle Mockups',
    },
    {
      name: 'price',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 29.99,
      required: true,
    },
    {
      name: 'sizes',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: ['s', 'm', 'l'],
      hasMany: true,
      options: [
        { label: 'XS', value: 'xs' },
        { label: 'S', value: 's' },
        { label: 'M', value: 'm' },
        { label: 'L', value: 'l' },
        { label: 'XL', value: 'xl' },
        { label: 'XXL', value: 'xxl' },
      ],
    },
    {
      name: 'colors',
      type: 'select',
      admin: {
        position: 'sidebar',
      },
      defaultValue: ['black', 'white'],
      hasMany: true,
      options: [
        { label: 'Black', value: 'black' },
        { label: 'White', value: 'white' },
        { label: 'Navy', value: 'navy' },
        { label: 'Heather Grey', value: 'heather-grey' },
        { label: 'Olive', value: 'olive' },
        { label: 'Burgundy', value: 'burgundy' },
      ],
    },
    {
      name: 'fit',
      type: 'text',
      admin: {
        description: 'E.g., Oversized Fit, Regular Fit',
        position: 'sidebar',
      },
      defaultValue: 'Regular Fit',
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
