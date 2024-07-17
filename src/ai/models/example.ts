export const exampleOutput = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'This is an example of text ',
            format: 0,
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'This text has example of ',
            format: 0,
          },
          {
            type: 'text',
            text: 'bold,',
            format: 1,
          },
          {
            type: 'text',
            text: 'italic,',
            format: 2,
          },
          {
            type: 'text',
            text: 'underline,',
            format: 8,
          },
          {
            type: 'text',
            text: 'strikethrough,',
            format: 4,
          },
          {
            type: 'text',
            text: 'code',
            format: 16,
          },
          {
            type: 'text',
            text: ' text types. Use these to highlight and emphasis specific content as needed.',
            format: 0,
          },
        ],
      },
      {
        type: 'list',
        listType: 'check',
        tag: 'ul',
        start: 1,
        children: [
          {
            type: 'listitem',
            value: 1,
            children: [
              {
                type: 'text',
                text: 'This is a checklist item #1',
              },
            ],
          },
          {
            type: 'listitem',
            value: 2,
            checked: true,
            children: [
              {
                type: 'text',
                text: 'This checklist item is checked',
              },
            ],
          },
        ],
      },
      {
        type: 'heading',
        tag: 'h1',
        children: [
          {
            type: 'text',
            text: 'Heading level 1',
          },
        ],
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: 'This paragraph has a ',
          },
          {
            type: 'link',
            fields: {
              url: 'https://example.com',
              newTab: true,
              linkType: 'custom',
            },
            id: 'unique-id-1',
            children: [
              {
                type: 'text',
                text: 'link',
              },
            ],
          },
          {
            type: 'text',
            text: ' that opens in a new tab.',
          },
        ],
      },
    ],
  },
}
