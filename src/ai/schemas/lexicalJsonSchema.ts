import type { JSONSchema } from 'openai/lib/jsonschema'

// Reusable individual node schemas (OpenAI Strict Mode Compliant)
// All properties in 'properties' MUST be listed in 'required'.
// 'additionalProperties' MUST be false.

const TextNodeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: { type: 'string', enum: ['text'] },
    detail: { type: 'number' },
    direction: { type: ['string', 'null'], enum: ['ltr', null] },
    format: { type: 'number' },
    indent: { type: 'number' },
    mode: { type: 'number' },
    style: { type: 'string' },
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
}

const LinkNodeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: { type: 'string', enum: ['link'] },
    children: {
      type: 'array',
      items: { $ref: '#/definitions/TextNode' }, // Links only contain text usually
    },
    direction: { type: ['string', 'null'], enum: ['ltr', null] },
    format: { type: 'string' }, // sometimes link has format?
    indent: { type: 'number' },
    url: { type: 'string' },
    version: { type: 'number' },
  },
  required: ['type', 'url', 'children', 'version', 'format', 'indent', 'direction'],
}

const LineBreakNodeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: { type: 'string', enum: ['linebreak'] },
    version: { type: 'number' },
  },
  required: ['type', 'version'],
}

const TabNodeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: { type: 'string', enum: ['tab'] },
    version: { type: 'number' },
  },
  required: ['type', 'version'],
}

// Block Nodes (Recursive Children)

const ParagraphNodeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: { type: 'string', enum: ['paragraph'] },
    children: {
      type: 'array',
      items: { $ref: '#/definitions/InlineNode' },
    },
    direction: { type: ['string', 'null'], enum: ['ltr', null] },
    format: { type: 'string', enum: ['start', 'center', 'right', 'justify', ''] },
    indent: { type: 'number' },
    textFormat: { type: 'number' },
    textStyle: { type: 'string' },
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
}

const HeadingNodeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: { type: 'string', enum: ['heading'] },
    children: {
      type: 'array',
      items: { $ref: '#/definitions/InlineNode' },
    },
    direction: { type: ['string', 'null'], enum: ['ltr', null] },
    format: { type: 'string' }, // Headings can have alignment
    indent: { type: 'number' },
    tag: { type: 'string', enum: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
    version: { type: 'number' },
  },
  required: ['type', 'tag', 'children', 'direction', 'indent', 'format', 'version'],
}

const QuoteNodeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: { type: 'string', enum: ['quote'] },
    children: {
      type: 'array',
      items: { $ref: '#/definitions/InlineNode' },
    },
    direction: { type: ['string', 'null'], enum: ['ltr', null] },
    format: { type: 'string' },
    indent: { type: 'number' },
    version: { type: 'number' },
  },
  required: ['type', 'children', 'direction', 'format', 'indent', 'version'],
}

const CodeNodeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: { type: 'string', enum: ['code'] },
    children: { // Code usually contains raw text nodes or tab/newline
       type: 'array', 
       items: { $ref: '#/definitions/InlineNode' } // simplified
    },
    direction: { type: ['string', 'null'], enum: ['ltr', null] },
    format: { type: 'string' },
    indent: { type: 'number' },
    language: { type: ['string', 'null'] },
    version: { type: 'number' },
  },
  required: ['type', 'children', 'language', 'version', 'format', 'indent', 'direction'],
}

// List related schemas
const ListItemNodeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: { type: 'string', enum: ['listitem'] },
    children: {
      type: 'array',
      items: { $ref: '#/definitions/BlockNode' }, // ListItems contain blocks (paragraphs, lists)
    },
    direction: { type: ['string', 'null'], enum: ['ltr', null] },
    format: { type: 'string' },
    // NOTE: Do not change the position of "indent", models like gpt generate properties as they are
    //  defined in schema, moving the position of property "indent"
    //  can cause issue with schema validation while streaming generated json to lexical editor
    indent: { type: 'number', enum: [0, 1] },
    value: { type: 'number' },
    version: { type: 'number' },
  },
  required: ['type', 'value', 'indent', 'children', 'direction', 'format', 'version'],
}

const ListNodeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: { type: 'string', enum: ['list'] },
    children: {
      type: 'array',
      items: { $ref: '#/definitions/ListItemNode' },
    },
    direction: { type: ['string', 'null'], enum: ['ltr', null] },
    format: { type: 'string' },
    indent: { type: 'number' },
    listType: { type: 'string', enum: ['number', 'bullet', 'check'] },
    start: { type: 'number' },
    tag: { type: 'string', enum: ['ul', 'ol'] },
    version: { type: 'number' },
  },
  required: ['type', 'listType', 'start', 'children', 'direction', 'format', 'indent', 'version', 'tag'],
}

const HorizontalRuleNodeSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    type: { type: 'string', enum: ['horizontalrule'] },
    version: { type: 'number' },
  },
  required: ['type', 'version'],
}

// Map mapping node types to their schema definitions and names
const NODE_DEFINITIONS: Record<string, { name: string; schema: any }> = {
  code: { name: 'CodeNode', schema: CodeNodeSchema },
  heading: { name: 'HeadingNode', schema: HeadingNodeSchema },
  horizontalrule: { name: 'HorizontalRuleNode', schema: HorizontalRuleNodeSchema },
  linebreak: { name: 'LineBreakNode', schema: LineBreakNodeSchema },
  link: { name: 'LinkNode', schema: LinkNodeSchema },
  list: { name: 'ListNode', schema: ListNodeSchema },
  listitem: { name: 'ListItemNode', schema: ListItemNodeSchema },
  paragraph: { name: 'ParagraphNode', schema: ParagraphNodeSchema },
  quote: { name: 'QuoteNode', schema: QuoteNodeSchema },
  tab: { name: 'TabNode', schema: TabNodeSchema },
  text: { name: 'TextNode', schema: TextNodeSchema },
}

export const ALL_SUPPORTED_NODES = Object.keys(NODE_DEFINITIONS)

/**
 * Dynamically builds a Lexical JSON Schema based on enabled nodes.
 * @param enabledNodeTypes Array of enabled node type strings (e.g., ['paragraph', 'text', 'heading'])
 */
export const buildLexicalSchema = (enabledNodeTypes: string[]): JSONSchema => {
  // Always enable core nodes
  const activeTypes = new Set(enabledNodeTypes)
  activeTypes.add('root')
  activeTypes.add('text')
  activeTypes.add('paragraph')
  activeTypes.add('linebreak')
  activeTypes.add('tab') // often implicitly available

  const definitions: Record<string, any> = {}
  const blockNodeRefs: { $ref: string }[] = []
  const inlineNodeRefs: { $ref: string }[] = []

  // Helper to add definition if not present
  const addDef = (type: string) => {
    const def = NODE_DEFINITIONS[type]
    if (def && !definitions[def.name]) {
      definitions[def.name] = def.schema
    }
  }

  // 1. Populate Definitions based on enabled types
  activeTypes.forEach((type) => {
    addDef(type)
    
    // Dependencies
    if (type === 'list') {
      addDef('listitem') 
    }
  })

  // 2. Build Refs groups for polymorphism
  // Inline: Text, Link, LineBreak, Tab
  if (activeTypes.has('text')) { inlineNodeRefs.push({ $ref: '#/definitions/TextNode' }) }
  if (activeTypes.has('link')) { inlineNodeRefs.push({ $ref: '#/definitions/LinkNode' }) }
  if (activeTypes.has('linebreak')) { inlineNodeRefs.push({ $ref: '#/definitions/LineBreakNode' }) }
  if (activeTypes.has('tab')) { inlineNodeRefs.push({ $ref: '#/definitions/TabNode' }) }

  // Block: Paragraph, Heading, Quote, Code, List, HorizontalRule, Image...
  if (activeTypes.has('paragraph')) { blockNodeRefs.push({ $ref: '#/definitions/ParagraphNode' }) }
  if (activeTypes.has('heading')) { blockNodeRefs.push({ $ref: '#/definitions/HeadingNode' }) }
  if (activeTypes.has('quote')) { blockNodeRefs.push({ $ref: '#/definitions/QuoteNode' }) }
  if (activeTypes.has('code')) { blockNodeRefs.push({ $ref: '#/definitions/CodeNode' }) }
  if (activeTypes.has('list')) { blockNodeRefs.push({ $ref: '#/definitions/ListNode' }) }
  if (activeTypes.has('horizontalrule')) { blockNodeRefs.push({ $ref: '#/definitions/HorizontalRuleNode' }) }

  // Add the groupings to definitions
  definitions.InlineNode = {
    anyOf: inlineNodeRefs
  }
  
  definitions.BlockNode = {
    anyOf: blockNodeRefs
  }

  // Root Schema
  const RootNodeSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      type: { type: 'string', enum: ['root'] },
      children: {
        type: 'array',
        items: { $ref: '#/definitions/BlockNode' },
      },
      direction: { type: ['string', 'null'], enum: ['ltr', null] },
      format: { type: 'string' },
      indent: { type: 'number' },
      version: { type: 'number' },
    },
    required: ['type', 'children', 'direction', 'format', 'indent', 'version'],
  }

  definitions.RootNode = RootNodeSchema

  return {
    type: 'object',
    $schema: 'http://json-schema.org/draft-07/schema#',
    additionalProperties: false,
    definitions,
    properties: {
      root: { $ref: '#/definitions/RootNode' },
      version: { type: 'number' } // Only if wrapped in { root: ..., version: ... }
    },
    required: ['root'],
  } as unknown as JSONSchema
}
