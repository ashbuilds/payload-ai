import type { CollectionConfig } from 'payload'

/**
 * ArrayTestCases collection
 * 
 * This collection contains various array field configurations to test
 * AI generation scenarios. Each group represents a different complexity level.
 */
export const ArrayTestCases: CollectionConfig = {
  slug: 'array-test-cases',
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  admin: {
    group: 'Testing',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      // admin: {
      //   description: 'Name this test case',
      // },
      required: true,
    },

    // ========================================
    // SCENARIO 1: Simple Array of Text
    // ========================================
    {
      type: 'collapsible',
      admin: {
        description: 'Basic array with a single text field per row',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'keywords',
          type: 'array',
          admin: {
            description: 'Generate a list of SEO keywords for this content',
          },
          fields: [
            {
              name: 'keyword',
              type: 'text',
              admin: {
                description: 'A single keyword or phrase',
              },
              required: true,
            },
          ],
          label: 'Keywords',
          maxRows: 10,
          minRows: 3,
        },
      ],
      label: 'Scenario 1: Simple Text Array',
    },

    // ========================================
    // SCENARIO 2: Array with Multiple Text Fields
    // ========================================
    {
      type: 'collapsible',
      admin: {
        description: 'Array with question + answer pairs (FAQ style)',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'faqs',
          type: 'array',
          admin: {
            description: 'Generate frequently asked questions with answers',
          },
          fields: [
            {
              name: 'question',
              type: 'textarea',
              admin: {
                description: 'The question being asked',
              },
              required: true,
            },
            {
              name: 'answer',
              type: 'textarea',
              admin: {
                description: 'Detailed answer to the question',
              },
              required: true,
            },
            {
              name: 'category',
              type: 'select',
              admin: {
                description: 'Category for organizing FAQs',
              },
              options: [
                { label: 'General', value: 'general' },
                { label: 'Technical', value: 'technical' },
                { label: 'Pricing', value: 'pricing' },
                { label: 'Support', value: 'support' },
              ],
            },
          ],
          label: 'FAQs',
          maxRows: 8,
          minRows: 3,
        },
      ],
      label: 'Scenario 2: Multi-Field Text Array',
    },

    // ========================================
    // SCENARIO 3: Array with Text + Image (Mixed)
    // ========================================
    {
      type: 'collapsible',
      admin: {
        description: 'Gallery with image + caption (COMPLEX CASE)',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'gallery',
          type: 'array',
          admin: {
            description: 'Generate gallery items with AI-generated images and captions',
          },
          fields: [
            {
              name: 'image',
              type: 'upload',
              admin: {
                description: 'The gallery image',
              },
              relationTo: 'media',
              required: true,
            },
            {
              name: 'caption',
              type: 'text',
              admin: {
                description: 'Short caption for the image',
              },
            },
            {
              name: 'alt',
              type: 'text',
              admin: {
                description: 'Accessibility text describing the image',
              },
              required: true,
            },
          ],
          label: 'Image Gallery',
          maxRows: 6,
          minRows: 2,
        },
      ],
      label: 'Scenario 3: Text + Image Array',
    },

    // ========================================
    // SCENARIO 3a: Image-Only Array (Simple)
    // ========================================
    {
      type: 'collapsible',
      admin: {
        description: 'Array with only upload/image fields (for batch image generation)',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'productContext',
          type: 'textarea',
          admin: {
            description: 'Describe the product for consistent image generation',
          },
        },
        {
          name: 'productPhotos',
          type: 'array',
          admin: {
            description: 'Generate multiple product images at different angles',
          },
          fields: [
            {
              name: 'photo',
              type: 'upload',
              admin: {
                description: 'A product photo',
              },
              relationTo: 'media',
              required: true,
            },
          ],
          label: 'Product Photos',
          maxRows: 6,
          minRows: 2,
        },
      ],
      label: 'Scenario 3a: Image-Only Array',
    },

    // ========================================
    // SCENARIO 4: Character Views (Your Use Case)
    // ========================================
    {
      type: 'collapsible',
      admin: {
        description: 'Array of character angles with images (sprite sheet use case)',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'characterContext',
          type: 'textarea',
          admin: {
            description: 'Describe the character for consistent image generation across views',
          },
        },
        {
          name: 'views',
          type: 'array',
          admin: {
            description: 'Generate character images from different angles',
          },
          fields: [
            {
              name: 'angle',
              type: 'select',
              admin: {
                description: 'Viewing angle for the character',
              },
              options: [
                { label: 'Front', value: 'front' },
                { label: 'Back', value: 'back' },
                { label: 'Left Profile', value: 'left' },
                { label: 'Right Profile', value: 'right' },
                { label: 'Front-Left (3/4)', value: 'front-left' },
                { label: 'Front-Right (3/4)', value: 'front-right' },
                { label: 'Back-Left', value: 'back-left' },
                { label: 'Back-Right', value: 'back-right' },
              ],
              required: true,
            },
            {
              name: 'image',
              type: 'upload',
              admin: {
                description: 'Generated image for this angle',
              },
              relationTo: 'media',
            },
            {
              name: 'description',
              type: 'textarea',
              admin: {
                description: 'Notes about this view (auto-generated or manual)',
              },
            },
          ],
          label: 'Character Views',
          maxRows: 8,
          minRows: 4,
        },
      ],
      label: 'Scenario 4: Character Sprite Views',
    },

    // ========================================
    // SCENARIO 5: Array with Group (Nested Structure)
    // ========================================
    {
      type: 'collapsible',
      admin: {
        description: 'Array items containing grouped sub-fields',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'teamMembers',
          type: 'array',
          admin: {
            description: 'Generate team member profiles with detailed information',
          },
          fields: [
            {
              name: 'name',
              type: 'text',
              admin: {
                description: 'Full name of team member',
              },
              required: true,
            },
            {
              name: 'role',
              type: 'text',
              admin: {
                description: 'Job title or role',
              },
            },
            {
              name: 'photo',
              type: 'upload',
              admin: {
                description: 'Profile photo',
              },
              relationTo: 'media',
            },
            {
              name: 'contact',
              type: 'group',
              fields: [
                {
                  name: 'email',
                  type: 'email',
                  admin: {
                    description: 'Work email address',
                  },
                },
                {
                  name: 'phone',
                  type: 'text',
                  admin: {
                    description: 'Phone number',
                  },
                },
                {
                  name: 'linkedin',
                  type: 'text',
                  admin: {
                    description: 'LinkedIn profile URL',
                  },
                },
              ],
              label: 'Contact Information',
            },
            {
              name: 'bio',
              type: 'textarea',
              admin: {
                description: 'Short biography',
              },
            },
          ],
          label: 'Team Members',
          maxRows: 6,
          minRows: 2,
        },
      ],
      label: 'Scenario 5: Array with Nested Groups',
    },

    // ========================================
    // SCENARIO 6: Simple Number Array
    // ========================================
    {
      type: 'collapsible',
      admin: {
        description: 'Array of numeric data points',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'dataPoints',
          type: 'array',
          admin: {
            description: 'Generate statistical data points',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              admin: {
                description: 'Label for this data point',
              },
              required: true,
            },
            {
              name: 'value',
              type: 'number',
              admin: {
                description: 'Numeric value',
              },
              required: true,
            },
            {
              name: 'unit',
              type: 'select',
              options: [
                { label: 'Percent', value: 'percent' },
                { label: 'Count', value: 'count' },
                { label: 'USD', value: 'usd' },
                { label: 'Hours', value: 'hours' },
              ],
            },
          ],
          label: 'Data Points',
          maxRows: 20,
          minRows: 5,
        },
      ],
      label: 'Scenario 6: Number Array',
    },

    // ========================================
    // SCENARIO 7: hasMany Text (Not Array Field)
    // ========================================
    {
      type: 'collapsible',
      admin: {
        description: 'Using hasMany:true instead of array type (simpler case)',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'tags',
          type: 'text',
          admin: {
            description: 'Tags for this content (using hasMany)',
          },
          hasMany: true,
          maxRows: 10,
          minRows: 2,
        },
        {
          name: 'categories',
          type: 'select',
          admin: {
            description: 'Multiple category selection',
          },
          hasMany: true,
          options: [
            { label: 'Technology', value: 'technology' },
            { label: 'Design', value: 'design' },
            { label: 'Marketing', value: 'marketing' },
            { label: 'Business', value: 'business' },
            { label: 'Science', value: 'science' },
          ],
        },
      ],
      label: 'Scenario 7: hasMany (Built-in Array)',
    },

    // ========================================
    // SCENARIO 8: Array with Conditional Fields
    // ========================================
    {
      type: 'collapsible',
      admin: {
        description: 'Array items with fields that appear based on conditions',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'contentBlocks',
          type: 'array',
          admin: {
            description: 'Generate content with different block types',
          },
          fields: [
            {
              name: 'blockType',
              type: 'select',
              options: [
                { label: 'Text', value: 'text' },
                { label: 'Quote', value: 'quote' },
                { label: 'Image', value: 'image' },
                { label: 'Code', value: 'code' },
              ],
              required: true,
            },
            {
              name: 'textContent',
              type: 'textarea',
              admin: {
                condition: (_, siblingData) => siblingData?.blockType === 'text',
                description: 'Paragraph content',
              },
            },
            {
              name: 'quote',
              type: 'group',
              admin: {
                condition: (_, siblingData) => siblingData?.blockType === 'quote',
              },
              fields: [
                {
                  name: 'text',
                  type: 'textarea',
                  admin: {
                    description: 'The quote text',
                  },
                },
                {
                  name: 'author',
                  type: 'text',
                  admin: {
                    description: 'Quote attribution',
                  },
                },
              ],
            },
            {
              name: 'imageBlock',
              type: 'upload',
              admin: {
                condition: (_, siblingData) => siblingData?.blockType === 'image',
                description: 'Block image',
              },
              relationTo: 'media',
            },
            {
              name: 'codeBlock',
              type: 'group',
              admin: {
                condition: (_, siblingData) => siblingData?.blockType === 'code',
              },
              fields: [
                {
                  name: 'code',
                  type: 'code',
                  admin: {
                    description: 'Code snippet',
                    language: 'javascript',
                  },
                },
                {
                  name: 'language',
                  type: 'select',
                  options: [
                    { label: 'JavaScript', value: 'javascript' },
                    { label: 'TypeScript', value: 'typescript' },
                    { label: 'Python', value: 'python' },
                    { label: 'CSS', value: 'css' },
                  ],
                },
              ],
            },
          ],
          label: 'Content Blocks',
        },
      ],
      label: 'Scenario 8: Conditional Fields in Array',
    },
  ],
}
