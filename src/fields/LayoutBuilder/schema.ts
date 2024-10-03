export const LexicalSchemaMap = {
  heading: {
    type: 'heading',
    variants: ['h1', 'h2', 'h3', 'h4'],
  },
  horizontalrule: {
    type: 'horizontalrule',
    children: [],
  },
  link: {
    type: 'link',
    children: [],
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
    children: [],
  },
  quote: {
    type: 'quote',
    children: ['paragraph'],
  },
  root: {
    type: 'root',
    children: ['paragraph', 'heading', 'list', 'quote', 'horizontalrule'],
  },
};
