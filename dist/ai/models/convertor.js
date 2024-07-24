// import { RichTextDocument } from '../RichTextSchema'
//
// interface LexicalNode {
//   type: string
//   [key: string]: any
// }
//
// export function convertToLexical(doc: RichTextDocument): LexicalNode {
//   const rootNode: LexicalNode = {
//     type: 'root',
//     children: [],
//   }
//
//   doc.document.forEach((node) => {
//     switch (node.type) {
//       case 'p':
//         rootNode.children.push(convertParagraph(node))
//         break
//       case 'h1':
//       case 'h2':
//       case 'h3':
//       case 'h4':
//       case 'h5':
//       case 'h6':
//         rootNode.children.push(convertHeading(node))
//         break
//       case 'ul':
//       case 'ol':
//         rootNode.children.push(convertList(node))
//         break
//     }
//   })
//
//   return rootNode
// }
//
// function convertParagraph(node: any): LexicalNode {
//   return {
//     type: 'paragraph',
//     children: node.content.map(convertTextNode),
//   }
// }
//
// function convertHeading(node: any): LexicalNode {
//   return {
//     type: 'heading',
//     tag: node.type,
//     children: [{ type: 'text', text: node.content }],
//   }
// }
//
// function convertList(node: any): LexicalNode {
//   return {
//     type: node.type === 'ul' ? 'unordered-list' : 'ordered-list',
//     children: node.items.map((item: any) => ({
//       type: 'list-item',
//       children: [{ type: 'text', text: item.content }],
//     })),
//   }
// }
//
// function convertTextNode(node: any): LexicalNode {
//   if (node.type === 'text') {
//     return { type: 'text', text: node.value }
//   } else {
//     return {
//       type: node.type,
//       children: [{ type: 'text', text: node.content }],
//     }
//   }
// }
export function convertToLexical(doc) {
    const rootNode = {
        type: 'root',
        children: []
    };
    doc.blocks.forEach((block)=>{
        switch(block.type){
            case 'paragraph':
                rootNode.children.push(convertParagraph(block));
                break;
            case 'heading':
                rootNode.children.push(convertHeading(block));
                break;
            case 'list':
                rootNode.children.push(convertList(block));
                break;
            case 'code':
                rootNode.children.push(convertCode(block));
                break;
            case 'blockquote':
                rootNode.children.push(convertBlockquote(block));
                break;
        }
    });
    return rootNode;
}
function convertParagraph(block) {
    return {
        type: 'paragraph',
        children: convertInlineContent(block.content)
    };
}
function convertHeading(block) {
    return {
        type: 'heading',
        children: convertInlineContent(block.content),
        tag: `h${block.level}`
    };
}
function convertList(block) {
    return {
        type: 'list',
        children: block.items?.map((item)=>({
                type: 'listitem',
                children: convertInlineContent(item)
            })) || [],
        listType: 'bullet'
    };
}
function convertCode(block) {
    return {
        type: 'code',
        children: [
            {
                type: 'text',
                text: block.content
            }
        ],
        language: block.language || ''
    };
}
function convertBlockquote(block) {
    return {
        type: 'quote',
        children: convertInlineContent(block.content)
    };
}
function convertInlineContent(content) {
    // Simple implementation for inline formatting
    const parts = content.split(/(\*\*.*?\*\*|\*.*?\*)/);
    return parts.map((part)=>{
        if (part.startsWith('**') && part.endsWith('**')) {
            return {
                type: 'text',
                format: 1,
                text: part.slice(2, -2)
            };
        } else if (part.startsWith('*') && part.endsWith('*')) {
            return {
                type: 'text',
                format: 2,
                text: part.slice(1, -1)
            };
        } else {
            return {
                type: 'text',
                text: part
            };
        }
    });
}

//# sourceMappingURL=convertor.js.map