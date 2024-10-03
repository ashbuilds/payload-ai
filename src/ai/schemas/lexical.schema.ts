import { z } from 'zod'

// Example of custom node - wip
// const MediaNode = BaseNode.extend({
//   type: z.literal('block'),
//   version: z.literal(2),
//   fields: z.object({
//     id: z.string(),
//     media: z.string(),
//     position: z.enum(['fullscreen', 'default']),
//     blockName: z.string(),
//     blockType: z.literal('mediaBlock'),
//   }),
// })

export const LexicalSchemaMap = {
  heading: {
    type: 'heading',
    children: ['text'],
    variants: ['h1', 'h2', 'h3', 'h4'],
  },
  horizontalrule: {
    type: 'horizontalrule',
    children: [],
  },
  link: {
    type: 'link',
    children: ['text'],
  },
  list: {
    type: 'list',
    children: ['listItem'],
    variants: ['ul', 'ol'],
  },
  listItem: {
    type: 'listItem',
    children: ['heading','paragraph', 'list'], // Allows nesting
  },
  paragraph: {
    type: 'paragraph',
    children: ['text', 'link'],
  },
  quote: {
    type: 'quote',
    children: ['paragraph'],
  },
  root: {
    type: 'root',
    children: ['paragraph', 'heading', 'list', 'quote', 'horizontalrule'],
  },
  text: {
    type: 'text',
    children: [],
  },
}



export const LexicalBaseNode = z.object({
  type: z.string(),
  children: z.array(z.any()).optional(),
  direction: z.enum(['ltr']).nullable().optional(),
  format: z.string().optional(),
  indent: z.number().optional(),
  version: z.number().optional(),
})

export const lexicalSchema = (customNodes?: (typeof LexicalBaseNode)[]) => {
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
    format: z.number().optional(),
    text: z.string(),
  })

  const LinkNode = BaseNode.extend({
    id: z.string(),
    type: z.literal('link', {
      description: 'Use to refer HTML anchor tag',
    }),
    fields: z.object({
      linkType: z.string(),
      newTab: z.boolean(),
      url: z.string(),
    }),
  })

  const ListItemNode = BaseNode.extend({
    type: z.literal('listitem',{description:'Use to refer HTML li(list item) tag'}),
    checked: z.boolean().optional(),
    value: z.number(),
  })

  const ListNode = BaseNode.extend({
    type: z.literal('list',{ description: 'Use to refer HTML unordered list and ordered list' }),
    listType: z.enum(['check', 'number', 'bullet']),
    start: z.number(),
    tag: z.enum(['ul', 'ol']),
  })

  const HeadingNode = BaseNode.extend({
    type: z.literal('heading', {
      description: 'Use to refer HTML heading tags, such as h1, h2, h3, h4 ',
    }),
    tag: z.enum(['h1', 'h2', 'h3', 'h4']),
  })

  const Node = z.union([
    TextNode,
    LinkNode,
    ListItemNode,
    ListNode,
    HeadingNode,
    BaseNode.extend({ type: z.enum(['paragraph', 'quote', 'horizontalrule']) }),
    ...(customNodes || []),
  ])

  const RootNode = BaseNode.extend({
    type: z.literal('root'),
  })

  return z.object({
    root: RootNode,
  })
}
