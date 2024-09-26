// @ts-nocheck
'use client'


import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import React, { useCallback, useState } from 'react'
import { PlusCircle, Trash2, GripVertical } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button, Select } from '@payloadcms/ui'

import styles from './LayoutBuilder.module.scss'

type BaseNodeType = {
  type: string;
  children?: LayoutNodeType[];
  direction?: 'ltr' | null;
  format?: string;
  indent?: number;
  version?: number;
};

type HeadingNodeType = BaseNodeType & {
  type: 'heading';
  tag: 'h1' | 'h2' | 'h3' | 'h4';
};

type HorizontalRuleNodeType = BaseNodeType & {
  type: 'horizontalrule';
};

type LinkNodeType = BaseNodeType & {
  type: 'link';
  id: string;
  fields: {
    linkType: string;
    newTab: boolean;
    url: string;
  };
};

type ParagraphNodeType = BaseNodeType & {
  type: 'paragraph';
};

type QuoteNodeType = BaseNodeType & {
  type: 'quote';
};

type TextNodeType = BaseNodeType & {
  type: 'text';
  format?: number;
  text: string;
};

type ListNodeType = BaseNodeType & {
  type: 'list';
  listType: 'check' | 'number' | 'bullet';
  start: number;
  tag: 'ul' | 'ol';
};

type ListItemNodeType = BaseNodeType & {
  type: 'listitem';
  checked?: boolean;
  value: number;
};

type LayoutNodeType =
  | HeadingNodeType
  | HorizontalRuleNodeType
  | LinkNodeType
  | ParagraphNodeType
  | QuoteNodeType
  | TextNodeType
  | ListNodeType
  | ListItemNodeType;

// The rest of the component code remains the same
const nodeTypes = [
  'heading',
  'horizontalrule',
  'link',
  'paragraph',
  'quote',
  'text',
  'list',
  'listitem',
]


const LayoutBuilder = () => {
  const [layout, setLayout] = useState<LayoutNodeType[]>([])

  const addNode = useCallback((parentPath = []) => {
    const prevLayout = [...layout];

    const newLayout = [...prevLayout];
    let current = newLayout
    for (const index of parentPath) {
      if(current[index].children){
        current = current[index].children
      }
    }

    current.push({ type: 'paragraph', children: [] });

    setLayout(newLayout);
  },[layout]);



  const updateNode = (path: number[], updates: Partial<LayoutNodeType>) => {
    setLayout(prevLayout => {
      const newLayout = [...prevLayout]
      let current = newLayout
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].children || []
      }
      const lastPath = path[path.length - 1];
      // @ts-ignore
      current[lastPath] = { ...current[lastPath], ...updates }
      return newLayout
    })
  }

  const removeNode = (path: number[]) => {
    setLayout(prevLayout => {
      const newLayout = [...prevLayout]
      let current = newLayout
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]].children || []
      }
      current.splice(path[path.length - 1], 1)
      return newLayout
    })
  }

  const onDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const sourcePath = result.source.droppableId.split('-').slice(1).map(Number);
    const destPath = result.destination.droppableId.split('-').slice(1).map(Number);

    setLayout((prevLayout) => {
      const newLayout = JSON.parse(JSON.stringify(prevLayout));

      // Helper function to get node by path
      const getNodeByPath = (layout, path) => {
        return path.reduce((acc, index) => acc[index]?.children || acc[index], layout);
      };

      // Remove the dragged item from its original position
      const sourceParent = getNodeByPath(newLayout, sourcePath);
      const [removed] = sourceParent.splice(result.source.index, 1);

      // Insert the item in its new position
      const destParent = getNodeByPath(newLayout, destPath);
      destParent?.splice(result.destination.index, 0, removed);

      return newLayout;
    });
  }, []);

  const renderNode = (node: LayoutNodeType, path: number[]) => {

    const nodes = node.children?.map((child, index) =>
      renderNode(child, [...path, index]),
    )

    const draggable = node.children && (
        <Droppable droppableId={`droppable-${path.join('-')}`} direction="vertical">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {nodes}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )

    return (
      <Draggable key={path.join('-')} draggableId={`draggable-${path.join('-')}`} index={path[path.length - 1]}
      >
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={styles.builder}
          >
            <div className={styles.inputWrapper}>
              <div {...provided.dragHandleProps}>
                <GripVertical className="h-5 w-5 text-gray-400" />
              </div>
              <Select
                className={styles.select}
                value={node.type}
                onChange={(value) => updateNode(path, { type: value })}
                options={nodeTypes.map(type => ({
                  label: type,
                  value: type,
                }))}
              >
              </Select>
              <Button onClick={() => addNode(path)} size="icon" variant="outline">
                <PlusCircle className="h-4 w-4" />
              </Button>
              <Button onClick={() => removeNode(path)} size="icon" variant="outline">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {node.type === 'text' && (
              <Input
                value={(node as TextNodeType).text || ''}
                onChange={(e) => updateNode(path, { text: e.target.value } as Partial<TextNodeType>)}
                placeholder="Enter text"
                className="mb-2"
              />
            )}
            {draggable}
          </div>
        )}
      </Draggable>
    )
  }

  const generateLayoutJSON = () => {
    const addDescription = (node: LayoutNodeType) => {
      let description = `A ${node.type} node`
      if (node.type === 'heading') {
        description += ' (HTML heading tag)'
      } else if (node.type === 'link') {
        description += ' (HTML anchor tag)'
      } else if (node.type === 'list') {
        description += ' (HTML unordered or ordered list)'
      } else if (node.type === 'listitem') {
        description += ' (HTML list item tag)'
      }
      return { ...node, description }
    }

    const processNode = (node: LayoutNodeType): LayoutNodeType => {
      const processedNode = addDescription(node)
      if (node.children) {
        processedNode.children = node.children.map(processNode)
      }
      return processedNode
    }

    return layout.map(processNode)
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Layout Builder</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="root" isDropDisabled={true}>
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {layout.map((node, index) => renderNode(node, [index]))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <Button onClick={() => addNode()} className="mt-4">Add Root Node</Button>
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Generated Layout JSON:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(generateLayoutJSON(), null, 2)}
        </pre>
      </div>
    </div>
  )
}

export { LayoutBuilder }
