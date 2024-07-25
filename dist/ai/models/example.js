export const exampleOutput = {
    root: {
        type: 'root',
        children: [
            {
                type: 'paragraph',
                children: [
                    {
                        type: 'text',
                        format: 0,
                        text: 'This is an example of text '
                    }
                ]
            },
            {
                type: 'paragraph',
                children: [
                    {
                        type: 'text',
                        format: 0,
                        text: 'This text has example of '
                    },
                    {
                        type: 'text',
                        format: 1,
                        text: 'bold,'
                    },
                    {
                        type: 'text',
                        format: 2,
                        text: 'italic,'
                    },
                    {
                        type: 'text',
                        format: 8,
                        text: 'underline,'
                    },
                    {
                        type: 'text',
                        format: 4,
                        text: 'strikethrough,'
                    },
                    {
                        type: 'text',
                        format: 16,
                        text: 'code'
                    },
                    {
                        type: 'text',
                        format: 0,
                        text: ' text types. Use these to highlight and emphasis specific content as needed.'
                    }
                ]
            },
            {
                type: 'list',
                children: [
                    {
                        type: 'listitem',
                        children: [
                            {
                                type: 'text',
                                text: 'This is a checklist item #1'
                            }
                        ],
                        value: 1
                    },
                    {
                        type: 'listitem',
                        checked: true,
                        children: [
                            {
                                type: 'text',
                                text: 'This checklist item is checked'
                            }
                        ],
                        value: 2
                    }
                ],
                listType: 'check',
                start: 1,
                tag: 'ul'
            },
            {
                type: 'heading',
                children: [
                    {
                        type: 'text',
                        text: 'Heading level 1'
                    }
                ],
                tag: 'h1'
            },
            {
                type: 'paragraph',
                children: [
                    {
                        type: 'text',
                        text: 'This paragraph has a '
                    },
                    {
                        id: 'unique-id-1',
                        type: 'link',
                        children: [
                            {
                                type: 'text',
                                text: 'link'
                            }
                        ],
                        fields: {
                            linkType: 'custom',
                            newTab: true,
                            url: 'https://example.com'
                        }
                    },
                    {
                        type: 'text',
                        text: ' that opens in a new tab.'
                    }
                ]
            }
        ]
    }
};

//# sourceMappingURL=example.js.map