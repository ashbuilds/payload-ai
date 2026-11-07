// @vitest-environment happy-dom
import { ListItemNode, ListNode } from '@lexical/list'
import { createEditor } from 'lexical'
import { expect, it, vi } from 'vitest'

import { setSafeLexicalState } from '../setSafeLexicalState.js'

it('renders a bold list label above its description, including after a save/reload', async () => {
  const errors: Error[] = []
  const makeEditor = () =>
    createEditor({ nodes: [ListNode, ListItemNode], onError: (e) => errors.push(e) })
  const editor = makeEditor()
  const root = document.createElement('div')
  editor.setRootElement(root)
  const paragraphs = [
    ['Embrace Curiosity', 1],
    ['Curiosity is the gateway.', 0],
  ].map(([text, format]) => ({
    type: 'paragraph',
    children: [{ type: 'text', detail: 0, format, mode: 'normal', style: '', text, version: 1 }],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  }))
  const state = {
    root: {
      type: 'root',
      children: [
        {
          type: 'list',
          children: [
            {
              type: 'listitem',
              children: paragraphs,
              direction: null,
              format: '',
              indent: 0,
              value: 1,
              version: 1,
            },
          ],
          direction: null,
          format: '',
          indent: 0,
          listType: 'bullet',
          start: 1,
          tag: 'ul',
          version: 1,
        },
      ],
      version: 1,
    },
  }
  const reloaded = makeEditor()
  const secondRoot = document.createElement('div')
  try {
    expect(setSafeLexicalState(state, editor)).toBe(true)
    expect(errors).toEqual([])
    await vi.waitFor(() => expect(root.innerHTML).toContain('<li'))
    const li = root.querySelector('li')!
    expect(li.querySelector('strong')?.textContent).toBe('Embrace Curiosity')
    expect(li.querySelector('strong')?.nextElementSibling?.tagName).toBe('BR')
    expect(li.querySelector('br')?.nextElementSibling?.textContent).toBe(
      'Curiosity is the gateway.',
    )
    const saved = JSON.stringify(editor.getEditorState().toJSON())
    reloaded.setRootElement(secondRoot)
    reloaded.setEditorState(reloaded.parseEditorState(saved))
    await vi.waitFor(() => expect(secondRoot.innerHTML).toBe(root.innerHTML))
    expect(errors).toEqual([])
  } finally {
    editor.setRootElement(null)
    reloaded.setRootElement(null)
  }
})
