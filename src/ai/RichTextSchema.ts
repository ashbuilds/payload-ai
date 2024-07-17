import { z } from 'zod'

const BaseNode = z.object({
  type: z.string(),
  children: z.array(z.lazy(() => Node)).optional(),
  direction: z.enum(['ltr']).nullable().optional(),
  format: z.string().optional(),
  indent: z.number().optional(),
  version: z.number().optional(),
})

const TextNode = BaseNode.extend({
  type: z.literal('text'),
  text: z.string(),
  format: z.number().optional(),
})

const LinkNode = BaseNode.extend({
  type: z.literal('link'),
  fields: z.object({
    url: z.string(),
    newTab: z.boolean(),
    linkType: z.string(),
  }),
  id: z.string(),
})

const ListItemNode = BaseNode.extend({
  type: z.literal('listitem'),
  value: z.number(),
  checked: z.boolean().optional(),
})

const ListNode = BaseNode.extend({
  type: z.literal('list'),
  listType: z.enum(['check', 'number', 'bullet']),
  start: z.number(),
  tag: z.enum(['ul', 'ol']),
})

const HeadingNode = BaseNode.extend({
  type: z.literal('heading'),
  tag: z.enum(['h1', 'h2', 'h3', 'h4']),
})

const Node = z.union([
  TextNode,
  LinkNode,
  ListItemNode,
  ListNode,
  HeadingNode,
  BaseNode.extend({ type: z.enum(['paragraph', 'quote', 'horizontalrule']) }),
])

const RootNode = BaseNode.extend({
  type: z.literal('root'),
})

export const DocumentSchema = z.object({
  root: RootNode,
})
