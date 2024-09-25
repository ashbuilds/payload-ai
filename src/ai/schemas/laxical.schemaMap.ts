import { z } from 'zod'

const BaseNode = z.object({
  type: z.string(),
  children: z.array(z.lazy(() => Node)).optional(),
  direction: z.enum(['ltr']).nullable().optional(),
  format: z.string().optional(),
  indent: z.number().optional(),
  version: z.number().optional(),
})

export const LexicalSchemaMap = {
   heading: BaseNode.extend({
    type: z.literal('heading',{ description: 'Use to refer HTML heading tags, such as h1, h2, h3, h4 '}),
    tag: z.enum(['h1', 'h2', 'h3', 'h4']),
  }),
  horizontalrule: BaseNode.extend({ type: z.literal('horizontalrule') }),
  link: BaseNode.extend({
    id: z.string(),
    type: z.literal('link',{
      description: 'Use to refer HTML anchor tag'
    }),
    fields: z.object({
      linkType: z.string(),
      newTab: z.boolean(),
      url: z.string(),
    }),
  }),
  paragraph: BaseNode.extend({ type: z.literal('paragraph') }),
  quote: BaseNode.extend({ type: z.literal('quote') }),
  text: BaseNode.extend({
    type: z.literal('text'),
    format: z.number().optional(),
    text: z.string(),
  }),
  list: BaseNode.extend({
    type: z.literal('list',{ description: 'Use to refer HTML unordered list and ordered list' }),
    listType: z.enum(['check', 'number', 'bullet']),
    start: z.number(),
    tag: z.enum(['ul', 'ol']),
  }),
  listItem: BaseNode.extend({
    type: z.literal('listitem',{description:'Use to refer HTML li(list item) tag'}),
    checked: z.boolean().optional(),
    value: z.number(),
  })
}

const Node = z.union([
  LexicalSchemaMap.text,
  LexicalSchemaMap.link,
  LexicalSchemaMap.list,
  LexicalSchemaMap.listItem,
  LexicalSchemaMap.heading,
  LexicalSchemaMap.paragraph,
  LexicalSchemaMap.quote,
  LexicalSchemaMap.horizontalrule
])