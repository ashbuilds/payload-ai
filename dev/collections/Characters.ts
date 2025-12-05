import type { CollectionConfig } from 'payload'

import { PayloadAiPluginLexicalEditorFeature } from '@ai-stack/payloadcms'
import {
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { orgCreateAccess, orgDeleteAccess, orgReadAccess, orgUpdateAccess } from '../access/org.js'

/**
 * NPCs are reusable characters that can appear across multiple stories and hunts.
 * AI-enabled fields: name (text), bio (richText).
 */
export const Characters: CollectionConfig = {
  slug: 'characters',
  access: {
    create: orgCreateAccess,
    delete: orgDeleteAccess,
    read: orgReadAccess,
    update: orgUpdateAccess,
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'organization',
      type: 'relationship',
      admin: {
        description: 'The organization that owns this NPC.',
        position: 'sidebar',
      },
      relationTo: 'organizations',
      required: false,
    },
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
        description: 'The name players will see for this NPC.',
      },
      label: 'Display name',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      admin: {
        description: 'High level function of this NPC in the story.',
      },
      label: 'Story role',
      options: [
        { label: 'Guide', value: 'guide' },
        { label: 'Rival', value: 'rival' },
        { label: 'Historian', value: 'historian' },
        { label: 'Narrator', value: 'narrator' },
        { label: 'Merchant', value: 'merchant' },
        { label: 'Scholar', value: 'scholar' },
        { label: 'Other', value: 'other' },
      ],
      required: true,
    },
    {
      type: 'group',
      fields: [
        {
          name: 'description',
          type: 'text',
          admin: {
            description: 'Very short description used in UI and in prompts.',
            placeholder: 'A calm archivist who sees patterns others miss.',
          },
          label: 'Description',
        },
        {
          name: 'visualProfile',
          type: 'group',
          fields: [
            {
              name: 'autoApply',
              type: 'checkbox',
              defaultValue: true,
            },
            // ----------------------------
            // DEMOGRAPHICS
            // ----------------------------
            {
              type: 'collapsible',
              admin: {
                initCollapsed: false,
              },
              fields: [
                {
                  name: 'demographics',
                  type: 'group',
                  fields: [
                    {
                      name: 'gender',
                      type: 'text',
                      admin: {
                        description: 'Gender presentation of the character.',
                      },
                      label: 'Gender',
                    },
                    {
                      name: 'ageRange',
                      type: 'text',
                      admin: {
                        description: 'Approximate perceived age.',
                        placeholder: 'example: early 30s',
                      },
                      label: 'Age Range',
                    },
                    {
                      name: 'ethnicity',
                      type: 'text',
                      admin: {
                        placeholder: 'example: South Asian, East African, Middle Eastern',
                      },
                      label: 'Ethnicity / Region',
                    },
                    {
                      name: 'skinTone',
                      type: 'text',
                      admin: {
                        placeholder: 'example: medium brown with warm undertones',
                      },
                      label: 'Skin Tone',
                    },
                  ],
                },
              ],
              label: 'Demographics',
            },

            // ----------------------------
            // FACE STRUCTURE
            // ----------------------------
            {
              type: 'collapsible',
              admin: {
                initCollapsed: false,
              },
              fields: [
                {
                  name: 'faceStructure',
                  type: 'group',
                  fields: [
                    {
                      name: 'faceShape',
                      type: 'text',
                      admin: {
                        placeholder: 'oval, angular, heart-shaped, round, etc.',
                      },
                      label: 'Face Shape',
                    },
                    {
                      name: 'eyeShape',
                      type: 'text',
                      admin: {
                        placeholder: 'almond-shaped, round, deep-set, etc.',
                      },
                      label: 'Eye Shape',
                    },
                    {
                      name: 'eyeColor',
                      type: 'text',
                      admin: {
                        placeholder: 'dark brown, hazel, green, etc.',
                      },
                      label: 'Eye Color',
                    },
                    {
                      name: 'eyebrows',
                      type: 'text',
                      admin: {
                        placeholder: 'slightly arched, thick, straight, medium thickness',
                      },
                      label: 'Eyebrows',
                    },
                    {
                      name: 'nose',
                      type: 'text',
                      admin: {
                        placeholder: 'straight, wide bridge, button, aquiline, etc.',
                      },
                      label: 'Nose',
                    },
                    {
                      name: 'lips',
                      type: 'text',
                      admin: {
                        placeholder: 'full lower lip, defined cupid’s bow',
                      },
                      label: 'Lips',
                    },
                    {
                      name: 'distinguishingFeatures',
                      type: 'text',
                      admin: {
                        placeholder: 'scar under left eye, freckles, birthmark, etc.',
                      },
                      label: 'Distinguishing Features',
                    },
                  ],
                },
              ],
              label: 'Face Structure',
            },

            // ----------------------------
            // HAIR
            // ----------------------------
            {
              type: 'collapsible',
              admin: {
                initCollapsed: false,
              },
              fields: [
                {
                  name: 'hair',
                  type: 'group',
                  fields: [
                    {
                      name: 'hairLength',
                      type: 'text',
                      admin: {
                        placeholder: 'short, medium, shoulder-length, long',
                      },
                      label: 'Hair Length',
                    },
                    {
                      name: 'hairTexture',
                      type: 'text',
                      admin: {
                        placeholder: 'curly, wavy, straight, coiled',
                      },
                      label: 'Hair Texture',
                    },
                    {
                      name: 'hairStyle',
                      type: 'text',
                      admin: {
                        placeholder: 'tied back bun, loose curls, braided crown, etc.',
                      },
                      label: 'Hair Style',
                    },
                    {
                      name: 'hairColor',
                      type: 'text',
                      admin: {
                        placeholder: 'black, chestnut brown, dark auburn, etc.',
                      },
                      label: 'Hair Color',
                    },
                  ],
                },
              ],
              label: 'Hair',
            },

            // ----------------------------
            // CULTURAL & ERA CONTEXT
            // ----------------------------
            {
              type: 'collapsible',
              admin: {
                initCollapsed: false,
              },
              fields: [
                {
                  name: 'culturalEra',
                  type: 'group',
                  fields: [
                    {
                      name: 'era',
                      type: 'text',
                      admin: {
                        placeholder: '15th century, early modern, etc.',
                      },
                      label: 'Era',
                    },
                    {
                      name: 'culture',
                      type: 'text',
                      admin: {
                        placeholder: 'Indian Ocean trade region, Swahili coast, etc.',
                      },
                      label: 'Culture / Region',
                    },
                    {
                      name: 'clothingStyle',
                      type: 'text',
                      admin: {
                        placeholder:
                          'layered linen garments, embroidered shawl, sailor tunic, etc.',
                      },
                      label: 'Clothing Style',
                    },
                    {
                      name: 'palette',
                      type: 'text',
                      admin: {
                        placeholder: 'earthy browns, muted beige, deep blue accents, etc.',
                      },
                      label: 'Color Palette',
                    },
                  ],
                },
              ],
              label: 'Cultural & Era Context',
            },

            // ----------------------------
            // EXPRESSION & PERSONALITY
            // ----------------------------
            {
              type: 'collapsible',
              admin: {
                initCollapsed: false,
              },
              fields: [
                {
                  name: 'expressionPersonality',
                  type: 'group',
                  fields: [
                    {
                      name: 'expression',
                      type: 'text',
                      admin: {
                        placeholder: 'calm and observant, warm smile, stern and focused, etc.',
                      },
                      label: 'Facial Expression',
                    },
                    {
                      name: 'vibe',
                      type: 'text',
                      admin: {
                        placeholder: 'quiet intelligence, energetic storyteller, steady leader',
                      },
                      label: 'Overall Vibe',
                    },
                    {
                      name: 'posture',
                      type: 'text',
                      admin: {
                        placeholder:
                          'upright and composed, relaxed and approachable, tense and alert',
                      },
                      label: 'Posture / Body Language',
                    },
                  ],
                },
              ],
              label: 'Expression & Personality',
            },
          ],
          label: 'Visual Profile',
        },
      ],
      label: 'Identity',
    },
    {
      name: 'portrait',
      type: 'upload',
      admin: {
        description: '2D portrait image used for UI/dialogue.',
      },
      label: 'Portrait',
      relationTo: 'media',
    },
    {
      name: 'model3D',
      type: 'upload',
      admin: {
        description:
          'Optional 3D model reference. Can be replaced with a dedicated assets collection later.',
      },
      label: '3D Model',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'Speech',
      type: 'upload',
      admin: {
        description: 'Generate character speech sample',
      },
      label: 'Speech',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'bio',
      type: 'richText',
      admin: {
        description:
          'A longer biography/personality profile. Use AI Compose to generate consistent backstory and voice.',
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
      label: 'Bio',
    },
    {
      name: 'linkedStories',
      type: 'relationship',
      admin: {
        description: 'Stories this NPC appears in (many-to-many).',
      },
      hasMany: true,
      label: 'Linked Stories',
      relationTo: 'stories',
    },
    {
      name: 'reusableAcrossHunts',
      type: 'checkbox',
      admin: {
        description:
          'Mark as a library NPC that can be reused across experiences for the same organization.',
      },
      defaultValue: false,
      label: 'Reusable Across Hunts',
    },
    {
      name: 'meta',
      type: 'json',
      admin: {
        description:
          'Optional engine metadata (dialogue IDs, voice actor ID, behavior flags, etc).',
      },
      label: 'Meta',
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        if (data.description && originalDoc.autoApply) {
          // Find the group/collapsible field safely
          const identityGroup = req.payload.collections.characters.config.fields.find(
            (f) => 'label' in f && f.label === 'Identity',
          )
          if (!identityGroup || !('fields' in identityGroup)) {
            return data
          }
          const visualProfileField = identityGroup.fields.find(
            (f) => 'name' in f && f.name === 'visualProfile',
          )
          if (visualProfileField && 'fields' in visualProfileField) {
            const { object } = await req.payload.ai.generate({
              prompt: `Generate a visual profile for a character described as: ${data.description}`,
              schema: visualProfileField.fields,
            })
            console.log('object', object)

            data.visualProfile = object
            data.visualProfile.autoApply = false
          }
        }
        return data
      },
    ],
  },
  versions: {
    maxPerDoc: 50,
  },
}
