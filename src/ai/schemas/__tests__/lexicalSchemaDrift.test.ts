import { $createCodeNode, CodeNode } from '@lexical/code'
import { $createLinkNode, LinkNode } from '@lexical/link'
import { $createListItemNode, $createListNode, ListItemNode, ListNode } from '@lexical/list'
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingNode,
  QuoteNode,
} from '@lexical/rich-text'
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table'
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTabNode,
  $createTextNode,
  $getRoot,
  createEditor,
} from 'lexical'
import { describe, expect, it } from 'vitest'

import { editorSchemaValidator } from '../../../utilities/editorSchemaValidator.js'
import { documentSchema } from '../lexicalJsonSchema.js'

const validate = editorSchemaValidator(documentSchema)

const createExportedLexicalState = () => {
  const editor = createEditor({
    nodes: [
      CodeNode,
      HeadingNode,
      LinkNode,
      ListItemNode,
      ListNode,
      QuoteNode,
      TableCellNode,
      TableNode,
      TableRowNode,
    ],
  })

  editor.update(
    () => {
      const root = $getRoot()
      root.clear()

      const paragraph = $createParagraphNode()
      paragraph.append(
        $createTextNode('Hello'),
        $createLineBreakNode(),
        $createTabNode(),
        $createTextNode('world'),
      )
      root.append(paragraph)

      const heading = $createHeadingNode('h2')
      heading.append($createTextNode('Heading'))
      root.append(heading)

      const quote = $createQuoteNode()
      quote.append($createTextNode('Quote'))
      root.append(quote)

      const list = $createListNode('number', 1)
      for (let index = 0; index < 3; index++) {
        const item = $createListItemNode()
        const itemParagraph = $createParagraphNode()
        itemParagraph.append($createTextNode(`Item ${index + 1}`))
        item.append(itemParagraph)
        list.append(item)
      }
      root.append(list)

      const linkParagraph = $createParagraphNode()
      const link = $createLinkNode('https://example.com')
      link.append($createTextNode('Example link'))
      linkParagraph.append(link)
      root.append(linkParagraph)

      const code = $createCodeNode('javascript')
      code.append($createTextNode('const value = 1'))
      root.append(code)

      const table = $createTableNode()
      const row = $createTableRowNode()
      const cell = $createTableCellNode(0)
      const cellParagraph = $createParagraphNode()
      cellParagraph.append($createTextNode('Cell'))
      cell.append(cellParagraph)
      row.append(cell)
      table.append(row)
      root.append(table)
    },
    { discrete: true },
  )

  return JSON.parse(JSON.stringify(editor.getEditorState().toJSON()))
}

describe('documentSchema Lexical drift', () => {
  it('accepts JSON exported by the installed Lexical nodes we support', () => {
    const exportedState = createExportedLexicalState()

    expect(validate(exportedState), JSON.stringify(validate.errors, null, 2)).toBe(true)
  })
})
