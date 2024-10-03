'use client'

import { Button, Popup, useField, useFieldProps } from '@payloadcms/ui'
import { PlusCircle, SquareMinus, SquarePlus, Trash2 } from 'lucide-react'
import Tree, { TreeNode } from 'rc-tree'
import 'rc-tree/assets/index.css'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import styles from './LayoutBuilder.module.scss'
import { LexicalSchemaMenu } from './Menu.js'
import { LexicalSchemaMap } from './schema.js'
import './tree.scss'
import { JSONFieldClientProps } from 'payload'

type LayoutNodeType = {
  children?: LayoutNodeType[]
  description?: string
  key: string
  title: string
  type: string
}

const LayoutBuilder: React.FC = (props: JSONFieldClientProps) => {
  const { path } = useFieldProps()
  const { setValue, value, ...restFieldInfo } = useField({
    path,
  })

  const [treeData, setTreeData] = useState<LayoutNodeType[]>(value as LayoutNodeType[] || [])
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const nodeIdCounter = useRef(0)

  const onChange = (treeObject) => {
   requestAnimationFrame(()=>{
     setValue(treeObject)
   })
  }

  useEffect(() => {
    console.log('props - >', props)
    console.log('field - >', restFieldInfo)
  }, [treeData])

  const generateKey = useCallback(() => {
    nodeIdCounter.current += 1
    return `node-${nodeIdCounter.current}`
  }, [nodeIdCounter])

  const addNode = useCallback(
    (parentKey: null | string, selected: string, parent?: Partial<LayoutNodeType>) => {
      setTreeData((prevTreeData) => {
        const createNode = (type: string, children?: LayoutNodeType[]): LayoutNodeType => ({
          type,
          children,
          description: '',
          key: generateKey(),
          title: type,
        })

        let newNode: LayoutNodeType

        if (parent?.type) {
          // Handle nested structures like list -> listitem
          newNode = createNode(parent.type)
          newNode.children = (parent.children as any)?.map((childType) => {
            const { children } = LexicalSchemaMap[childType]
            return createNode(
              childType?.type || childType,
              children ? [createNode(children[0])] : undefined,
            )
          })
        } else {
          newNode = createNode(selected)
        }

        const addNodeToTree = (nodes: LayoutNodeType[]): LayoutNodeType[] => {
          return nodes.map((node) => {
            if (node.key === parentKey) {
              return {
                ...node,
                children: [...(node.children || []), newNode],
              }
            } else if (node.children) {
              return {
                ...node,
                children: addNodeToTree(node.children),
              }
            }
            return node
          })
        }
        const mutatedNodes = parentKey ? addNodeToTree(prevTreeData) : [...prevTreeData, newNode]
        onChange(mutatedNodes)

        return mutatedNodes
      })
    },
    [generateKey],
  )

  const updateNode = useCallback((key: string, updates: Partial<LayoutNodeType>) => {
    setTreeData((prevTreeData) => {
      const updateNodeInTree = (nodes: LayoutNodeType[]): LayoutNodeType[] => {
        return nodes.map((node) => {
          if (node.key === key) {
            return { ...node, ...updates }
          } else if (node.children) {
            return {
              ...node,
              children: updateNodeInTree(node.children),
            }
          }
          return node
        })
      }
      const mutatedNodes = updateNodeInTree(prevTreeData)
      onChange(mutatedNodes)

      return mutatedNodes
    })
  }, [])

  const removeNode = useCallback((key: string) => {
    setTreeData((prevTreeData) => {
      const removeNodeFromTree = (nodes: LayoutNodeType[]): LayoutNodeType[] => {
        return nodes.filter((node) => {
          if (node.key === key) {
            return false
          } else if (node.children) {
            node.children = removeNodeFromTree(node.children)
          }
          return true
        })
      }
      const mutatedNodes = removeNodeFromTree(prevTreeData)
      onChange(mutatedNodes)

      return mutatedNodes
    })
  }, [])

  const onDragDrop = useCallback((info: any) => {
    const { dragNode, dropPosition, dropToGap, node: dropNode } = info

    setTreeData((prevTreeData) => {
      const loop = (
        data: LayoutNodeType[],
        key: React.Key,
        callback: (node: LayoutNodeType, index: number, arr: LayoutNodeType[]) => void,
      ) => {
        data.forEach((item, index, arr) => {
          if (item.key === key) {
            callback(item, index, arr)
            return
          }
          if (item.children) {
            loop(item.children, key, callback)
          }
        })
      }

      const data = [...prevTreeData]
      let dragObj: LayoutNodeType | undefined

      loop(data, dragNode.key, (item, index, arr) => {
        arr.splice(index, 1)
        dragObj = item
      })

      if (!dragObj) {
        console.error('Dragged node not found')
        return prevTreeData
      }

      if (!dropNode) {
        // Dropping at root level
        return dropPosition < 0 ? [dragObj, ...data] : [...data, dragObj]
      }

      if (dropToGap) {
        let ar: LayoutNodeType[] | undefined
        let i: number | undefined
        loop(data, dropNode.key, (item, index, arr) => {
          ar = arr
          i = index
        })

        if (ar && typeof i === 'number') {
          if (dropPosition === -1) {
            ar.splice(i, 0, dragObj)
          } else {
            ar.splice(i + 1, 0, dragObj)
          }
        }
      } else {
        loop(data, dropNode.key, (item) => {
          item.children = item.children || []
          item.children.unshift(dragObj)
        })
      }

      onChange(data)

      return data
    })
  }, [])

  const popup = useCallback(
    (node, button = <PlusCircle className="h-4 w-4" size={12} />) => {
      return (
        <Popup
          button={button}
          render={({ close }) => (
            <LexicalSchemaMenu
              onSelect={(selected, parent) => {
                addNode(node.key, selected, parent)
                close()
              }}
            />
          )}
          verticalAlign="bottom"
        />
      )
    },
    [addNode],
  )

  const renderTreeNodes = (nodes: LayoutNodeType[] = []): React.ReactNode => {
    return nodes.map((node) => (
      <TreeNode
        icon={<span />}
        key={node.key}
        selectable={false}
        switcherIcon={
          <span>
            <SquarePlus className="rc-lb-open" size="16px" />
            <SquareMinus className="rc-lb-close" size="16px" />
          </span>
        }
        title={
          <div className={styles.nodeWrapper}>
            <div className={styles.item}>
              {node.type !== 'horizontalrule' ? (
                <React.Fragment>
                  <span className={styles.nodeType}>{node.type}</span>
                  <div
                    className={styles.contentEditable}
                    contentEditable
                    dangerouslySetInnerHTML={{ __html: node.description || '' }}
                    onBlur={(e) =>
                      updateNode(node.key, { description: e.currentTarget.textContent || '' })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        addNode(node.key, 'paragraph')
                      }
                    }}
                  />
                </React.Fragment>
              ) : (
                <hr className={styles.horizontalrule} />
              )}
            </div>
            {popup(node)}
            <Button
              buttonStyle="none"
              className={styles.removeNodeButton}
              onClick={() => removeNode(node.key)}
            >
              <Trash2 className="h-4 w-4" size={12} />
            </Button>
          </div>
        }
      >
        {node.children && renderTreeNodes(node.children)}
      </TreeNode>
    ))
  }

  return (
    <div className={styles.wrapper}>
      <h1 className="text-2xl font-bold mb-4">Layout Builder</h1>
      {/* @ts-expect-error */}
      <Tree
        className={styles.rcTree}
        draggable
        expandedKeys={expandedKeys}
        onDrop={onDragDrop}
        onExpand={(keys) => setExpandedKeys(keys as string[])}
      >
        {renderTreeNodes(treeData)}
      </Tree>
      {popup([], <Button className="mt-4">Add Root Node</Button>)}
      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-2">Generated Layout JSON:</h2>
        <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(treeData, null, 2)}</pre>
      </div>
    </div>
  )
}

export { LayoutBuilder }
