import type { SerializedEditorState } from 'lexical'

import { describe, expect, it } from 'vitest'

import {
  BLOCK_PLACEHOLDER_PREFIX,
  BLOCK_PLACEHOLDER_SUFFIX,
  withBlockPlaceholders,
} from '../lexicalToHTML.js'
import { reinsertPreservedBlocks } from '../setSafeLexicalState.js'

const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [{ type: 'text', text }],
})

const block = (blockType: string) => ({
  type: 'block',
  fields: { blockType },
})

const marker = (index: number) => `${BLOCK_PLACEHOLDER_PREFIX}${index}${BLOCK_PLACEHOLDER_SUFFIX}`

describe('withBlockPlaceholders', () => {
  it('replaces a top-level block node with a marker paragraph', () => {
    const editorData = {
      root: { children: [paragraph('before'), block('image'), paragraph('after')] },
    } as unknown as SerializedEditorState

    const result = withBlockPlaceholders(editorData) as any

    expect(result.root.children).toHaveLength(3)
    expect(result.root.children[0]).toEqual(editorData.root.children[0])
    expect(result.root.children[1].type).toBe('paragraph')
    expect(result.root.children[1].children[0].text).toBe(marker(0))
    expect(result.root.children[2]).toEqual(editorData.root.children[2])
  })

  it('numbers multiple blocks in document order', () => {
    const editorData = {
      root: { children: [block('image'), paragraph('middle'), block('gallery')] },
    } as unknown as SerializedEditorState

    const result = withBlockPlaceholders(editorData) as any

    expect(result.root.children[0].children[0].text).toBe(marker(0))
    expect(result.root.children[2].children[0].text).toBe(marker(1))
  })

  it('returns the input unchanged when there are no blocks', () => {
    const editorData = {
      root: { children: [paragraph('only text')] },
    } as unknown as SerializedEditorState

    const result = withBlockPlaceholders(editorData) as any

    expect(result.root.children[0]).toEqual(editorData.root.children[0])
  })
})

describe('reinsertPreservedBlocks', () => {
  it('swaps a marker paragraph back for the original block at the same position', () => {
    const originalRoot = {
      children: [paragraph('before'), block('image'), paragraph('after')],
    }
    // Model regenerated the surrounding text but echoed the marker back verbatim.
    const nextChildren = [
      paragraph('regenerated before'),
      paragraph(marker(0)),
      paragraph('regenerated after'),
    ]

    const merged = reinsertPreservedBlocks(originalRoot, nextChildren)

    expect(merged).toHaveLength(3)
    expect(merged[1]).toEqual(originalRoot.children[1])
  })

  it('preserves multiple blocks matched by their own marker index', () => {
    const originalRoot = {
      children: [block('image'), paragraph('middle'), block('gallery')],
    }
    const nextChildren = [
      paragraph(marker(0)),
      paragraph('regenerated middle'),
      paragraph(marker(1)),
    ]

    const merged = reinsertPreservedBlocks(originalRoot, nextChildren)

    expect(merged[0]).toEqual(originalRoot.children[0])
    expect(merged[2]).toEqual(originalRoot.children[2])
  })

  it('falls back to a proportional position when the marker is missing from the output', () => {
    const originalRoot = {
      children: [paragraph('a'), paragraph('b'), block('image'), paragraph('c')],
    }
    // Model dropped the marker entirely - block must still be reinserted, not lost.
    const nextChildren = [paragraph('x'), paragraph('y')]

    const merged = reinsertPreservedBlocks(originalRoot, nextChildren)

    expect(merged).toHaveLength(3)
    expect(merged.some((node) => (node as any).type === 'block')).toBe(true)
  })

  it('returns nextChildren unchanged when there were no blocks to preserve', () => {
    const originalRoot = { children: [paragraph('a'), paragraph('b')] }
    const nextChildren = [paragraph('regenerated')]

    const merged = reinsertPreservedBlocks(originalRoot, nextChildren)

    expect(merged).toBe(nextChildren)
  })

  it('returns nextChildren unchanged when there is no original root snapshot', () => {
    const nextChildren = [paragraph('regenerated')]

    const merged = reinsertPreservedBlocks(null, nextChildren)

    expect(merged).toBe(nextChildren)
  })
})
