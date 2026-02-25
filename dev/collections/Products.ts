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
              prompt: `Composition:
High-quality lifestyle photography shot.
T-Shirt Design(s): @artwork

Output requirements:
- Photorealistic lifestyle photography (editorial / lookbook style)
- A person naturally wearing the t-shirt in the described environment
- Professional lighting, depth of field, and dynamic composition
- The design must look naturally printed on the t-shirt with realistic fabric folds
- NO text overlays, borders, or UI elements
---
{{ #mockupDescription }}`,
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
            '{{ #mockupDescription }}',
            '',
            'Write a concise, fun, conversion-focused product description for this t-shirt.',
            '',
            'Use this product context:',
            '- Product name: {{ name }}',
            '- Artwork reference(s): @artwork',
            '- Lifestyle mockup reference(s): @mockups',
            '- Available colors: {{ colors }}',
            '- Available sizes: {{ sizes }}',
            '',
            'Voice and style:',
            '- Write like a creative marketer: playful, vivid, and confident',
            '- Keep it clean, readable, and natural (not robotic)',
            '',
            'Output requirements:',
            '- 2 short paragraphs, 60-90 words total',
            '- Make the design feel exciting and wearable in real life',
            '- Mention available colors and sizes naturally when provided',
            '- No headings, no bullet points, no emojis, no hashtags',
            '- Do not invent specs, materials, or guarantees',
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
