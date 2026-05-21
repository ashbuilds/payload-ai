'use client'

import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { AutoLinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import {
  BlockNode,
  createClientFeature,
  HorizontalRuleNode,
  InlineBlockNode,
  LinkNode,
  RelationshipNode,
  UploadNode,
} from '@payloadcms/richtext-lexical/client'
import { LineBreakNode, TabNode, TextNode } from 'lexical'

import { ComposeFeatureComponent } from './ComposeFeatureComponent.js'

const aiComposeNodes = [
  TextNode,
  LineBreakNode,
  TabNode,
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  BlockNode,
  InlineBlockNode,
  HorizontalRuleNode,
  RelationshipNode,
  UploadNode,
]

const getPathFromSchemaPath = (schemaPath?: string, fallback?: string) => {
  if (!schemaPath) {
    return fallback
  }

  const [, ...pathParts] = schemaPath.split('.')
  const path = pathParts.join('.')

  return path || fallback
}

export const LexicalEditorFeatureClient = createClientFeature((props) => {
  const path = getPathFromSchemaPath(props.schemaPath, props.field?.name)

  return {
    nodes: aiComposeNodes,
    plugins: [
      {
        Component: ComposeFeatureComponent,
        position: 'belowContainer',
      },
    ],
    sanitizedClientFeatureProps: {
      field: props.field,
      path,
      schemaPath: props.schemaPath,
      ...props?.props,
    },
  }
})
