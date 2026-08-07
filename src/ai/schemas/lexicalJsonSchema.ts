import type { JSONSchema } from 'openai/lib/jsonschema'

import { isObjectSchema } from '../utils/isObjectSchema.js'

export interface LexicalNodeSchema extends JSONSchema {
  $schema?: string
  additionalProperties?: boolean
  definitions?: Record<string, any>
  properties: {
    [key: string]: any
    children?: {
      items: {
        $ref?: string
        anyOf?: { $ref: string }[]
      }
      type: 'array'
    }
    type?: {
      enum: string[]
      type: 'string'
    }
  }
  required?: string[]
  type: 'object'
}

export const documentSchema: LexicalNodeSchema = {
  type: 'object',
  $schema: 'http://json-schema.org/draft-07/schema#',
  additionalProperties: false,
  definitions: {
    LineBreakNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['linebreak'] },
        version: { type: 'number' },
      },
      required: ['type', 'version'],
    },
    TabNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['tab'] },
        detail: { type: 'number' },
        format: { type: 'number' },
        mode: {
          type: 'string',
          enum: ['normal', 'token', 'segmented'],
        },
        style: { type: 'string' },
        text: { type: 'string', enum: ['\t'] },
        version: { type: 'number' },
      },
      required: ['type', 'detail', 'format', 'mode', 'style', 'text', 'version'],
    },
    // Text Node (Leaf Node)
    TextNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['text'] },
        detail: {
          type: 'number',
          description: 'Text detail flags',
          enum: [
            0, // No details
            1, // IS_DIRECTIONLESS
            2, // IS_UNMERGEABLE
            3, // IS_DIRECTIONLESS + IS_UNMERGEABLE
          ],
          examples: [
            { description: 'No special details', value: 0 },
            { description: 'Directionless', value: 1 },
            { description: 'Unmergeable', value: 2 },
            { description: 'Directionless + Unmergeable', value: 3 },
          ],
        },
        direction: {
          type: ['string', 'null'],
          enum: ['ltr', null],
        },
        format: {
          type: 'number',
          description: `Format flags for text:
    0 = No format
    1 = Bold
    2 = Italic
    3 = Bold + Italic (1|2)
    4 = Strikethrough
    8 = Underline
    9 = Bold + Underline (1|8)
    16 = Code
    32 = Subscript
    64 = Superscript
    128 = Highlight
    
    Formats can be combined using binary OR (|).
    Example combinations:
    - Bold + Italic = 1|2 = 3
    - Bold + Underline = 1|8 = 9
    - Italic + Underline = 2|8 = 10
    - Bold + Italic + Underline = 1|2|8 = 11`,
        },
        indent: { type: 'number' },
        mode: {
          anyOf: [
            {
              type: 'number',
              enum: [
                0, // Normal
                1, // Token
                2, // Segmented
              ],
            },
            {
              type: 'string',
              enum: ['normal', 'token', 'segmented'],
            },
          ],
          description: 'Text mode flags',
          examples: [
            { description: 'Normal text', value: 0 },
            { description: 'Token text', value: 1 },
            { description: 'Segmented text', value: 2 },
          ],
        },
        style: {
          type: 'string',
          description: 'CSS style string (e.g., "color: red; font-size: 12px;")',
        },
        text: { type: 'string' },
        version: { type: 'number' },
      },
      required: [
        'type',
        'text',
        'format',
        'style',
        'mode',
        'detail',
        'direction',
        'indent',
        'version',
      ],
    },
    // Styled Table Cell Node
    TableCellNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['tablecell'] },
        backgroundColor: {
          type: ['string', 'null'],
        },
        children: {
          type: 'array',
          items: {
            anyOf: [
              { $ref: '#/definitions/ParagraphNode' },
              { $ref: '#/definitions/TextNode' },
              { $ref: '#/definitions/LineBreakNode' },
            ],
          },
        },
        colSpan: { type: 'number' },
        direction: {
          type: ['string', 'null'],
          enum: ['ltr', null],
        },
        format: { type: 'string' },
        headerState: { type: 'number' },
        indent: { type: 'number' },
        rowSpan: { type: 'number' },
        version: { type: 'number' },
        width: {
          type: ['number', 'null'],
        },
      },
      required: [
        'type',
        'children',
        'headerState',
        'colSpan',
        'width',
        'backgroundColor',
        'direction',
        'format',
        'indent',
        'rowSpan',
        'version',
      ],
    },
    // Styled Table Row Node
    TableRowNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['tablerow'] },
        children: {
          type: 'array',
          items: {
            $ref: '#/definitions/TableCellNode',
          },
        },
        direction: {
          type: ['string', 'null'],
          enum: ['ltr', null],
        },
        format: { type: 'string' },
        height: { type: 'number' },
        indent: { type: 'number' },
        version: { type: 'number' },
      },
      required: ['type', 'children', 'height', 'direction', 'format', 'indent', 'version'],
    },
    // Styled Table Node
    TableNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['table'] },
        children: {
          type: 'array',
          items: {
            $ref: '#/definitions/TableRowNode',
          },
        },
        direction: {
          type: ['string', 'null'],
          enum: ['ltr', null],
        },
        format: { type: 'string' },
        indent: { type: 'number' },
        version: { type: 'number' },
      },
      required: ['type', 'children', 'direction', 'format', 'indent', 'version'],
    },
    // Heading Node
    HeadingNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['heading'] },
        children: {
          type: 'array',
          items: {
            anyOf: [
              { $ref: '#/definitions/TextNode' },
              { $ref: '#/definitions/LinkNode' },
              { $ref: '#/definitions/LineBreakNode' },
              { $ref: '#/definitions/TabNode' },
            ],
          },
        },
        direction: {
          type: ['string', 'null'],
          enum: ['ltr', null],
        },
        format: { type: 'string' },
        indent: { type: 'number' },
        tag: { type: 'string', enum: ['h1', 'h2', 'h3'] },
        version: { type: 'number' },
      },
      required: ['type', 'tag', 'children', 'direction', 'format', 'indent', 'version'],
    },
    // Paragraph Node
    ParagraphNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['paragraph'] },
        children: {
          type: 'array',
          items: {
            anyOf: [
              { $ref: '#/definitions/TextNode' },
              { $ref: '#/definitions/LinkNode' },
              { $ref: '#/definitions/CodeNode' },
              { $ref: '#/definitions/LineBreakNode' },
              { $ref: '#/definitions/TabNode' },
            ],
          },
        },
        direction: {
          type: ['string', 'null'],
          enum: ['ltr', null],
        },
        format: {
          type: 'string',
          description:
            'Paragraph alignment. Use "start" by default for normal prose. Use "center" or "right" only when the layout, content type, or target language clearly calls for that alignment.',
          enum: ['', 'start', 'center', 'right'],
        },
        indent: { type: 'number' },
        textFormat: { type: 'number' },
        textStyle: {
          type: 'string',
          description: 'CSS style string (e.g., "color: red; font-size: 12px;")',
        },
        version: { type: 'number' },
      },
      required: [
        'type',
        'children',
        'direction',
        'format',
        'indent',
        'textFormat',
        'textStyle',
        'version',
      ],
    },
    // Link Node
    LinkNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['link'] },
        children: {
          type: 'array',
          items: {
            $ref: '#/definitions/TextNode',
          },
        },
        direction: {
          type: ['string', 'null'],
          enum: ['ltr', null],
        },
        format: { type: 'string' },
        indent: { type: 'number' },
        rel: { type: ['string', 'null'] },
        target: { type: ['string', 'null'] },
        title: { type: ['string', 'null'] },
        url: { type: 'string' },
        version: { type: 'number' },
      },
      required: [
        'type',
        'url',
        'children',
        'direction',
        'format',
        'indent',
        'rel',
        'target',
        'title',
        'version',
      ],
    },
    // List Item Node
    ListItemNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        // NOTE: Do not change the position of "indent", models like gpt generate properties as they are
        //  defined in schema, moving the position of property "indent"
        //  can cause issue with schema validation while streaming generated json to lexical editor
        indent: { type: 'number', enum: [0, 1] },

        type: { type: 'string', enum: ['listitem'] },
        checked: {
          type: ['boolean', 'null'],
        },
        children: {
          type: 'array',
          items: {
            anyOf: [
              { $ref: '#/definitions/ParagraphNode' },
              { $ref: '#/definitions/TextNode' },
              { $ref: '#/definitions/ListNode' },
              { $ref: '#/definitions/LineBreakNode' },
            ],
          },
        },
        direction: {
          type: ['string', 'null'],
          enum: ['ltr', null],
        },
        format: { type: 'string' },
        value: {
          type: 'number',
          description:
            'Ordered list item value. For numbered lists, increment from the parent list start value: 1, 2, 3, etc.',
        },
        version: { type: 'number' },
      },
      required: ['indent', 'type', 'checked', 'children', 'direction', 'format', 'value', 'version'],
    },
    // List Node
    ListNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['list'] },
        children: {
          type: 'array',
          items: {
            $ref: '#/definitions/ListItemNode',
          },
        },
        direction: {
          type: ['string', 'null'],
          enum: ['ltr', null],
        },
        format: { type: 'string' },
        indent: { type: 'number' },
        listType: { type: 'string', enum: ['bullet', 'number', 'check'] },
        start: {
          type: 'number',
          description: 'Starting number for ordered lists. Use 1 unless another start is requested.',
        },
        tag: { type: 'string', enum: ['ul', 'ol'] },
        version: { type: 'number' },
      },
      required: ['type', 'listType', 'children', 'direction', 'format', 'indent', 'start', 'tag', 'version'],
    },
    // Quote Node
    QuoteNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['quote'] },
        children: {
          type: 'array',
          items: {
            anyOf: [
              { $ref: '#/definitions/TextNode' },
              { $ref: '#/definitions/ParagraphNode' },
              { $ref: '#/definitions/LineBreakNode' },
              { $ref: '#/definitions/TabNode' },
            ],
          },
        },
        direction: {
          type: ['string', 'null'],
          enum: ['ltr', null],
        },
        format: { type: 'string' },
        indent: { type: 'number' },
        version: { type: 'number' },
      },
      required: ['type', 'children', 'direction', 'format', 'indent', 'version'],
    },
    // Code Node
    CodeNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['code'] },
        children: {
          type: 'array',
          items: {
            anyOf: [
              { $ref: '#/definitions/TextNode' },
              { $ref: '#/definitions/LineBreakNode' },
              { $ref: '#/definitions/TabNode' },
            ],
          },
        },
        direction: {
          type: ['string', 'null'],
          enum: ['ltr', null],
        },
        format: { type: 'string' },
        indent: { type: 'number' },
        language: { type: 'string' },
        version: { type: 'number' },
      },
      required: ['type', 'children', 'direction', 'format', 'indent', 'language', 'version'],
    },
    // Horizontal Rule Node
    HorizontalRuleNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['horizontalrule'] },
      },
      required: ['type'],
    },
    // Image Node
    ImageNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['image'] },
        alt: { type: 'string' },
        caption: {
          type: 'array',
          items: {
            $ref: '#/definitions/TextNode',
          },
        },
        src: { type: 'string' },
      },
      required: ['type', 'src', 'alt', 'caption'],
    },
    // Root Node
    RootNode: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['root'] },
        children: {
          type: 'array',
          items: {
            anyOf: [
              { $ref: '#/definitions/TextNode' },
              { $ref: '#/definitions/HeadingNode' },
              { $ref: '#/definitions/ParagraphNode' },
              { $ref: '#/definitions/LinkNode' },
              { $ref: '#/definitions/ListNode' },
              { $ref: '#/definitions/QuoteNode' },
              { $ref: '#/definitions/CodeNode' },
              { $ref: '#/definitions/HorizontalRuleNode' },
              { $ref: '#/definitions/ImageNode' },
              { $ref: '#/definitions/TableNode' },
            ],
          },
        },
        direction: {
          type: ['string', 'null'],
          enum: ['ltr', null],
        },
        format: { type: 'string' },
        indent: { type: 'number' },
        version: { type: 'number' },
      },
      required: ['type', 'children', 'direction', 'format', 'indent', 'version'],
    },
  },
  properties: {
    root: {
      $ref: '#/definitions/RootNode',
    },
  },
  required: ['root'],
}

export const lexicalJsonSchema = (customNodes: JSONSchema[] | undefined) => {
  const schema = structuredClone(documentSchema)

  if (Array.isArray(customNodes) && customNodes.length > 0) {
    customNodes.forEach((nodeObj) => {
      for (const [nodeName, nodeDefinition] of Object.entries(nodeObj)) {
        // @ts-ignore
        schema.definitions[nodeName] = nodeDefinition

        // @ts-ignore
        const rootNode = schema.definitions['RootNode']
        if (isObjectSchema(rootNode)) {
          const children = rootNode.properties?.children
          const items = children?.items
          const anyOfList = (items as any)?.anyOf

          if (Array.isArray(anyOfList)) {
            anyOfList.push({ $ref: `#/definitions/${nodeName}` })
          }
        }
      }
    })
  }

  return schema
}
