import { z } from 'zod';
const BaseNode = z.object({
    type: z.string(),
    children: z.array(z.lazy(()=>Node)).optional(),
    direction: z.enum([
        'ltr'
    ]).nullable().optional(),
    format: z.string().optional(),
    indent: z.number().optional(),
    version: z.number().optional()
});
const TextNode = BaseNode.extend({
    type: z.literal('text'),
    format: z.number().optional(),
    text: z.string()
});
const LinkNode = BaseNode.extend({
    id: z.string(),
    type: z.literal('link'),
    fields: z.object({
        linkType: z.string(),
        newTab: z.boolean(),
        url: z.string()
    })
});
const ListItemNode = BaseNode.extend({
    type: z.literal('listitem'),
    checked: z.boolean().optional(),
    value: z.number()
});
const ListNode = BaseNode.extend({
    type: z.literal('list'),
    listType: z.enum([
        'check',
        'number',
        'bullet'
    ]),
    start: z.number(),
    tag: z.enum([
        'ul',
        'ol'
    ])
});
const HeadingNode = BaseNode.extend({
    type: z.literal('heading'),
    tag: z.enum([
        'h1',
        'h2',
        'h3',
        'h4'
    ])
});
const Node = z.union([
    TextNode,
    LinkNode,
    ListItemNode,
    ListNode,
    HeadingNode,
    BaseNode.extend({
        type: z.enum([
            'paragraph',
            'quote',
            'horizontalrule'
        ])
    })
]);
const RootNode = BaseNode.extend({
    type: z.literal('root')
});
export const DocumentSchema = z.object({
    root: RootNode
});

//# sourceMappingURL=RichTextSchema.js.map