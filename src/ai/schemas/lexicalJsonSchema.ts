const CommonProperties = {
  type: 'object',
  properties: {
    children: {
      type: 'array',
      items: { $ref: '#/definitions/Node' },
    },
    direction: {
      type: ['string', 'null'],
      enum: ['ltr', null],
    },
    format: { type: 'string' },
    indent: { type: 'number' },
    version: { type: 'number' },
  },
}

const BaseNode = {
  type: 'object',
  allOf: [{ $ref: '#/definitions/CommonProperties' }],
  properties: {
    type: { type: 'string' },
  },
  required: ['type'],
}

const CommonNodes = {
  allOf: [
    { $ref: '#/definitions/BaseNode' },
    {
      properties: {
        type: {
          type: 'string',
          enum: ['paragraph', 'quote', 'horizontalrule'],
        },
      },
    },
  ],
}

const HeadingNode = {
  allOf: [
    { $ref: '#/definitions/BaseNode' },
    {
      properties: {
        type: { const: 'heading' },
        tag: {
          type: 'string',
          enum: ['h1', 'h2', 'h3', 'h4'],
        },
      },
      required: ['tag'],
    },
  ],
}

const LinkNode = {
  allOf: [
    { $ref: '#/definitions/BaseNode' },
    {
      properties: {
        id: { type: 'string' },
        type: { const: 'link' },
        fields: {
          type: 'object',
          properties: {
            linkType: { type: 'string' },
            newTab: { type: 'boolean' },
            url: { type: 'string' },
          },
          required: ['linkType', 'newTab', 'url'],
        },
      },
      required: ['id', 'fields'],
    },
  ],
}

const ListItemNode = {
  allOf: [
    { $ref: '#/definitions/BaseNode' },
    {
      properties: {
        type: { const: 'listitem' },
        checked: { type: 'boolean' },
        value: { type: 'number' },
      },
      required: ['value'],
    },
  ],
}

const ListNode = {
  allOf: [
    { $ref: '#/definitions/BaseNode' },
    {
      properties: {
        type: { const: 'list' },
        listType: {
          type: 'string',
          enum: ['check', 'number', 'bullet'],
        },
        start: { type: 'number' },
        tag: {
          type: 'string',
          enum: ['ul', 'ol'],
        },
      },
      required: ['listType', 'start', 'tag'],
    },
  ],
}

// const MediaNode = {
//   allOf: [
//     { $ref: '#/definitions/BaseNode' },
//     {
//       properties: {
//         type: { const: 'block' },
//         fields: {
//           type: 'object',
//           properties: {
//             id: { type: 'string' },
//             blockName: { type: 'string' },
//             blockType: { const: 'mediaBlock' },
//             media: { type: 'string' },
//             position: {
//               type: 'string',
//               enum: ['fullscreen', 'default'],
//             },
//           },
//           required: ['id', 'media', 'position', 'blockName', 'blockType'],
//         },
//         version: { const: 2 },
//       },
//       required: ['version', 'fields'],
//     },
//   ],
// }

const Node = {
  oneOf: [
    { $ref: '#/definitions/TextNode' },
    { $ref: '#/definitions/LinkNode' },
    { $ref: '#/definitions/ListItemNode' },
    { $ref: '#/definitions/ListNode' },
    { $ref: '#/definitions/HeadingNode' },
    { $ref: '#/definitions/CommonNodes' },
  ],
}

const RootNode = {
  allOf: [
    { $ref: '#/definitions/BaseNode' },
    {
      properties: {
        type: { const: 'root' },
      },
    },
  ],
}

const TextNode = {
  allOf: [
    { $ref: '#/definitions/BaseNode' },
    {
      properties: {
        type: { const: 'text' },
        format: { type: 'number' },
        text: { type: 'string' },
      },
      required: ['text'],
    },
  ],
}

const baseJsonSchema = {
  type: 'object',
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    BaseNode,
    CommonNodes,
    CommonProperties,
    HeadingNode,
    LinkNode,
    ListItemNode,
    ListNode,
    // MediaNode,
    Node,
    RootNode,
    TextNode,
  },
  properties: {
    root: { $ref: '#/definitions/RootNode' },
  },
  required: ['root'],
}

export const lexicalJsonSchema = (customNodes = []) => {
  const schema = JSON.parse(JSON.stringify(baseJsonSchema))

  // Add custom nodes to the Node definition
  if (customNodes.length > 0) {
    customNodes.forEach((customNode, index) => {
      const customNodeName = `CustomNode${index + 1}`
      schema.definitions[customNodeName] = customNode
      schema.definitions.Node.oneOf.push({ $ref: `#/definitions/${customNodeName}` })
    })
  }

  return schema
}
