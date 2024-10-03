const baseJsonSchema = {
  type: 'object',
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    BaseNode: {
      type: 'object',
      properties: {
        type: { type: 'string' },
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
      required: ['type'],
    },
    HeadingNode: {
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
    },
    LinkNode: {
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
    },
    ListItemNode: {
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
    },
    ListNode: {
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
    },
    // MediaNode: {
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
    // },
    Node: {
      oneOf: [
        { $ref: '#/definitions/TextNode' },
        { $ref: '#/definitions/LinkNode' },
        { $ref: '#/definitions/ListItemNode' },
        { $ref: '#/definitions/ListNode' },
        { $ref: '#/definitions/HeadingNode' },
        // { $ref: '#/definitions/MediaNode' },
        {
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
        },
      ],
    },
    RootNode: {
      allOf: [
        { $ref: '#/definitions/BaseNode' },
        {
          properties: {
            type: { const: 'root' },
          },
        },
      ],
    },
    TextNode: {
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
    },
  },
  properties: {
    root: {
      $ref: '#/definitions/RootNode',
    },
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

//
// const customNode = {
//   "allOf": [
//     { "$ref": "#/definitions/BaseNode" },
//     {
//       "properties": {
//         "type": { "const": "customBlock" },
//         "customField": { "type": "string" }
//       },
//       "required": ["customField"]
//     }
//   ]
// };
//
// const schema = lexicalSchema([customNode]);
// console.log(JSON.stringify(schema, null, 2));
