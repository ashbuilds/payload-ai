import { z } from 'zod'

const BaseNode = z.object({
  type: z.string(),
  children: z.array(z.lazy(() => Node)).optional(),
  description: z.string().optional(),
  direction: z.enum(['ltr']).nullable().optional(),
  format: z.string().optional(),
  indent: z.number().optional(),
  key: z.string().optional(),
  title: z.string().optional(),
  version: z.number().optional(),
})

const TextNode = BaseNode.extend({
  type: z.literal('text'),
  format: z.number().optional(),
  text: z.string(),
})

const LinkNode = BaseNode.extend({
  id: z.string(),
  type: z.literal('link'),
  fields: z.object({
    linkType: z.string(),
    newTab: z.boolean(),
    url: z.string(),
  }),
})

const ListItemNode = BaseNode.extend({
  type: z.literal('listItem'),
})

const ListNode = BaseNode.extend({
  type: z.literal('list'),
  listType: z.enum(['check', 'number', 'bullet']).optional(),
  start: z.number().optional(),
  tag: z.enum(['ul', 'ol']).optional(),
})

const HeadingNode = BaseNode.extend({
  type: z.literal('heading'),
  tag: z.enum(['h1', 'h2', 'h3', 'h4']),
})

const QuoteNode = BaseNode.extend({
  type: z.literal('quote'),
})

const HorizontalRuleNode = BaseNode.extend({
  type: z.literal('horizontalrule'),
})

const ParagraphNode = BaseNode.extend({
  type: z.literal('paragraph'),
})

const Node = z.union([
  TextNode,
  LinkNode,
  ListItemNode,
  ListNode,
  HeadingNode,
  QuoteNode,
  HorizontalRuleNode,
  ParagraphNode,
])
function reorganizeZodSchema(json: any): z.ZodType<any> {
  function createNodeSchema(node: any): z.ZodType<any> {
    const baseSchema = BaseNode

    const childrenSchema = node.children
      ? z.array(z.lazy(() => z.union(node.children.map(createNodeSchema))))
      : undefined

    switch (node.type) {
      case 'heading':
        return baseSchema.extend({
          children: childrenSchema,
          tag: z.enum(['h1', 'h2', 'h3', 'h4']).optional(),
        })
      case 'paragraph':
        return baseSchema.extend({
          children: childrenSchema,
        })
      case 'horizontalrule':
        return baseSchema
      case 'list':
        return baseSchema.extend({
          children: childrenSchema,
          listType: z.enum(['check', 'number', 'bullet']).optional(),
          start: z.number().optional(),
          tag: z.enum(['ul', 'ol']).optional(),
        })
      case 'listItem':
        return baseSchema.extend({
          checked: z.boolean().optional(),
          children: childrenSchema,
          value: z.number().optional(),
        })
      case 'quote':
        return baseSchema.extend({
          children: childrenSchema,
        })
      default:
        return baseSchema.extend({
          children: childrenSchema,
        })
    }
  }

  const rootSchema = z.array(z.lazy(() => z.union(json.map(createNodeSchema))))

  return z.object({
    root: z.object({
      type: z.literal('root'),
      children: rootSchema,
    }),
  })
}

export { reorganizeZodSchema }

// The base schema for each node type
const schemas = {
  heading: z.object({
    type: z.literal('heading'),
    children: z.array(z.lazy(() => NodeSchema)).optional(),
    tag: z.enum(['h1', 'h2', 'h3', 'h4']),
    description: z.string().optional(),
    key: z.string().optional(),
    title: z.string().optional(),
  }),
  paragraph: z.object({
    type: z.literal('paragraph'),
    children: z.array(z.lazy(() => NodeSchema)).optional(),
    description: z.string().optional(),
    key: z.string().optional(),
    title: z.string().optional(),
  }),
  list: z.object({
    type: z.literal('list'),
    children: z.array(z.lazy(() => NodeSchema)).optional(),
    listType: z.enum(['check', 'number', 'bullet']).optional(),
    start: z.number().optional(),
    tag: z.enum(['ul', 'ol']).optional(),
    description: z.string().optional(),
    key: z.string().optional(),
    title: z.string().optional(),
  }),
  listItem: z.object({
    type: z.literal('listItem'),
    children: z.array(z.lazy(() => NodeSchema)).optional(),
    description: z.string().optional(),
    key: z.string().optional(),
    title: z.string().optional(),
  }),
  horizontalrule: z.object({
    type: z.literal('horizontalrule'),
    description: z.string().optional(),
    key: z.string().optional(),
    title: z.string().optional(),
  }),
  quote: z.object({
    type: z.literal('quote'),
    children: z.array(z.lazy(() => NodeSchema)).optional(),
    description: z.string().optional(),
    key: z.string().optional(),
    title: z.string().optional(),
  }),
}

// Union of all node schemas
const NodeSchema = z.union([
  schemas.heading,
  schemas.paragraph,
  schemas.list,
  schemas.listItem,
  schemas.horizontalrule,
  schemas.quote,
])

// Root schema that holds all the nodes
const RootNodeSchema = z.array(NodeSchema);

// Recursive function to build schema from JSON
function createZodSchemaFromJson(json: any): z.ZodTypeAny {
  if (Array.isArray(json)) {
    // The root node is an array of NodeSchema
    return RootNodeSchema.describe("Root node containing all child nodes");
  }

  // Select the schema based on the node type
  const schema = schemas[json.type];

  if (!schema) {
    throw new Error(`Unknown node type: ${json.type}`);
  }

  // Recursively handle children and apply description if present
  const nodeSchema = schema.describe(json.description || '');

  if (json.children) {
    const childrenSchema = z.array(createZodSchemaFromJson(json.children));
    return nodeSchema.extend({
      children: childrenSchema.optional(),
    });
  }

  return nodeSchema;
}

export { createZodSchemaFromJson }
