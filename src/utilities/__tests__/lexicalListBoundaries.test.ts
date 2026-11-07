import { LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { createEditor } from 'lexical'
import { describe, expect, it } from 'vitest'

import { documentSchema } from '../../ai/schemas/lexicalJsonSchema.js'
import { editorSchemaValidator } from '../editorSchemaValidator.js'
import { sanitizeLexicalState, setSafeLexicalState } from '../setSafeLexicalState.js'

type Node = { [key: string]: unknown; children?: Node[]; type: string }
const text = (value: string, format = 0): Node => ({
  type: 'text',
  detail: 0,
  format,
  mode: 'normal',
  style: '',
  text: value,
  version: 1,
})
const paragraph = (...children: Node[]): Node => ({
  type: 'paragraph',
  children,
  direction: null,
  format: '',
  indent: 0,
  textFormat: 0,
  textStyle: '',
  version: 1,
})
const br = (): Node => ({ type: 'linebreak', version: 1 })
const item = (children: Node[], checked: boolean | null = null): Node => ({
  type: 'listitem',
  checked,
  children,
  direction: null,
  format: '',
  indent: 0,
  value: 1,
  version: 1,
})
const list = (children: Node[], listType = 'bullet'): Node => ({
  type: 'list',
  children,
  direction: null,
  format: '',
  indent: 0,
  listType,
  start: 1,
  tag: listType === 'number' ? 'ol' : 'ul',
  version: 1,
})
const state = (children: Node[]) => ({
  root: { type: 'root', children, direction: null, format: '', indent: 0, version: 1 },
})
const normalize = (children: Node[]) =>
  sanitizeLexicalState(state([list([item(children)])]))!.root.children[0].children![0].children!
const editor = () =>
  createEditor({
    nodes: [ListNode, ListItemNode, LinkNode],
    onError: (error) => {
      throw error
    },
  })

const label = text('Embrace Curiosity', 1)
const description = text('Curiosity is the gateway to creativity.')

describe('list paragraph boundaries', () => {
  it.each(['bullet', 'number', 'check'])(
    'survives applying, saving and reloading a %s list',
    (kind) => {
      const input = state([
        list(
          [item([paragraph(label), paragraph(description)], kind === 'check' ? true : null)],
          kind,
        ),
      ])
      const instance = editor()
      expect(setSafeLexicalState(input, instance)).toBe(true)
      const saved = JSON.parse(JSON.stringify(instance.getEditorState().toJSON()))
      const savedList = saved.root.children[0]
      expect(savedList.listType).toBe(kind)
      expect(savedList.children[0].children).toEqual([label, br(), description])
      if (kind === 'check') {
        expect(savedList.children[0].checked).toBe(true)
      }
      const reloaded = editor().parseEditorState(saved).toJSON()
      expect(reloaded).toEqual(saved)
      expect(sanitizeLexicalState(saved)).toEqual(saved)
      // Normalizing must not mutate generation snapshots used for streaming/history.
      expect(input.root.children[0].children![0].children![0].type).toBe('paragraph')
    },
  )

  it.each([
    [label, paragraph(description)],
    [paragraph(label), description],
  ])('preserves mixed inline/paragraph boundaries', (...children) => {
    expect(normalize(children)).toEqual([label, br(), description])
  })

  it.each([
    [paragraph(label, br()), paragraph(description)],
    [paragraph(label), paragraph(br(), description)],
    [paragraph(label), br(), paragraph(description)],
  ])('does not duplicate explicit line breaks', (...children) => {
    expect(normalize(children)).toEqual([label, br(), description])
  })

  it('leaves inline formatting and intentional whitespace unchanged', () => {
    const inline = [text('inter', 1), text('national'), text(': '), description]
    expect(normalize(inline)).toEqual(inline)
    expect(normalize([paragraph(...inline)])).toEqual(inline)
  })

  it('normalizes nested items without inserting breaks around nested lists', () => {
    const nested = list([item([paragraph(label), paragraph(description)])])
    const children = normalize([paragraph(text('Parent')), nested, paragraph(text('After'))])
    expect(children.map((node) => node.type)).toEqual(['text', 'list', 'text'])
    expect(children[1].children![0].children).toEqual([label, br(), description])
  })

  it('preserves links and their formatting inside paragraphs', () => {
    const link: Node = {
      type: 'link',
      children: [text('Learn more')],
      url: 'https://example.com',
      version: 1,
    }
    expect(normalize([paragraph(label), paragraph(link)])).toEqual([label, br(), link])
  })

  it('keeps streaming snapshots stable when the next paragraph is still incomplete', () => {
    expect(normalize([paragraph(label), { type: 'paragraph' }])).toEqual([label])
    expect(normalize([paragraph(label), paragraph({ type: 'text' })])).toEqual([label])
    expect(normalize([paragraph(label), paragraph(text('Cur'))])).toEqual([
      label,
      br(),
      text('Cur'),
    ])
    expect(normalize([paragraph(label), paragraph(description)])).toEqual([
      label,
      br(),
      description,
    ])
  })

  it('leaves top-level paragraphs intact', () => {
    const input = state([paragraph(label), paragraph(description)])
    expect(sanitizeLexicalState(input)).toEqual(input)
  })

  it('generates only canonical list content while still normalizing legacy paragraph wrappers', () => {
    const validate = editorSchemaValidator(documentSchema)
    const legacy = state([list([item([paragraph(label), paragraph(description)])])])
    expect(validate(legacy)).toBe(false)
    const canonical = sanitizeLexicalState(legacy)
    expect(validate(canonical), JSON.stringify(validate.errors)).toBe(true)
    expect(validate(state([list([item([label, br(), description])])]))).toBe(true)
  })
})
