import { describe, expect, it } from 'vitest'

import { sanitizeLexicalChildren, sanitizeLexicalState } from '../setSafeLexicalState.js'

const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [{ type: 'text', text }],
})

const heading = (tag: unknown, text: string) => ({
  type: 'heading',
  children: [{ type: 'text', text }],
  tag,
})

describe('sanitizeLexicalChildren', () => {
  it('drops a heading whose tag has not arrived yet', () => {
    const children = [paragraph('done'), heading('', 'still streaming')]

    const sanitized = sanitizeLexicalChildren(children)

    expect(sanitized).toEqual([children[0]])
  })

  it('keeps siblings that follow an unrenderable node', () => {
    const children = [paragraph('a'), heading(undefined, 'incomplete'), paragraph('b')]

    const sanitized = sanitizeLexicalChildren(children)

    expect(sanitized).toEqual([children[0], children[2]])
  })

  it('keeps every heading level Lexical can render', () => {
    const children = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) => heading(tag, tag))

    const sanitized = sanitizeLexicalChildren(children)

    expect(sanitized).toEqual(children)
  })

  it('drops nodes without a usable type', () => {
    const children = [{ children: [] }, { type: '' }, 'not a node', null, paragraph('kept')]

    const sanitized = sanitizeLexicalChildren(children)

    expect(sanitized).toEqual([paragraph('kept')])
  })

  it('drops a text node whose text has not arrived yet', () => {
    const children = [{ type: 'text' }, { type: 'text', text: 'ready' }]

    const sanitized = sanitizeLexicalChildren(children)

    expect(sanitized).toEqual([{ type: 'text', text: 'ready' }])
  })

  it('sanitizes nested children recursively', () => {
    const children = [
      {
        type: 'quote',
        children: [paragraph('kept'), { type: '' }],
      },
    ]

    const sanitized = sanitizeLexicalChildren(children)

    expect(sanitized).toEqual([{ type: 'quote', children: [paragraph('kept')] }])
  })

  it('drops incomplete streamed text nodes inside a paragraph', () => {
    const children = [
      {
        type: 'paragraph',
        children: [{ type: 'text' }, { type: 'text', text: 'visible' }],
      },
    ]

    const sanitized = sanitizeLexicalChildren(children)

    expect(sanitized).toEqual([
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'visible' }],
      },
    ])
  })

  it('passes unknown node types through when no registry is available', () => {
    const children = [{ type: 'block', fields: { blockType: 'image' } }]

    const sanitized = sanitizeLexicalChildren(children)

    expect(sanitized).toEqual(children)
  })

  it('drops a type the editor cannot deserialize', () => {
    // "line" is what a partially streamed "linebreak" looks like.
    const children = [paragraph('kept'), { type: 'line' }]

    const sanitized = sanitizeLexicalChildren(children, new Set(['linebreak', 'paragraph', 'text']))

    expect(sanitized).toEqual([children[0]])
  })

  it('checks registered types in nested children too', () => {
    const children = [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'kept' }, { type: 'line' }],
      },
    ]

    const sanitized = sanitizeLexicalChildren(children, new Set(['paragraph', 'text']))

    expect(sanitized).toEqual([paragraph('kept')])
  })

  it('returns an empty array for a children value that is not an array yet', () => {
    expect(sanitizeLexicalChildren(undefined)).toEqual([])
  })
})

describe('sanitizeLexicalState', () => {
  it('removes the incomplete node a generation stopped on', () => {
    // What an answer cut off by the model's output token limit looks like.
    const state = { root: { type: 'root', children: [paragraph('complete'), { type: 'heading' }] } }

    const sanitized = sanitizeLexicalState(state)

    expect(sanitized?.root.children).toEqual([paragraph('complete')])
  })

  it('keeps the surrounding root properties intact', () => {
    const state = { root: { type: 'root', children: [paragraph('a')], version: 1 } }

    const sanitized = sanitizeLexicalState(state)

    expect(sanitized?.root).toMatchObject({ type: 'root', direction: null, indent: 0, version: 1 })
  })

  it('returns null for a value that is not a Lexical state', () => {
    expect(sanitizeLexicalState({ notARoot: true })).toBeNull()
  })
})
