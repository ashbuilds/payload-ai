import { describe, expect, it } from 'vitest'

import { documentSchema } from '../../ai/schemas/lexicalJsonSchema.js'
import { editorSchemaValidator } from '../editorSchemaValidator.js'
import { repairTruncatedLexicalResult } from '../repairTruncatedLexicalResult.js'

// The validator the generation actually runs against, not a stand-in for it.
const validate = editorSchemaValidator(documentSchema)

const text = (value: string) => ({
  type: 'text',
  detail: 0,
  direction: null,
  format: 0,
  indent: 0,
  mode: 0,
  style: '',
  text: value,
  version: 1,
})

const heading = (tag: string, value: string) => ({
  type: 'heading',
  children: [text(value)],
  direction: null,
  indent: 0,
  tag,
  version: 1,
})

const paragraph = (value: string) => ({
  type: 'paragraph',
  children: [text(value)],
  direction: null,
  format: 'start',
  indent: 0,
  textFormat: 0,
  textStyle: '',
  version: 1,
})

/** The tail of a response that stopped inside a node: a text node that never got its `text`. */
const truncatedHeading = {
  type: 'heading',
  children: [{ type: 'text', detail: 0, direction: null, format: 0, indent: 0, mode: 0 }],
}

const documentWith = (children: unknown[]) => ({ root: { type: 'root', children } })

describe('repairTruncatedLexicalResult', () => {
  it('makes a cut-off result valid by dropping the node it stopped on', () => {
    const document = documentWith([heading('h1', 'Privacy Policy'), paragraph('As of July 2026'), truncatedHeading])

    expect(validate(document)).toBe(false)

    const repaired = repairTruncatedLexicalResult(document, validate)

    expect(validate(repaired)).toBe(true)
    expect((repaired as any).root.children).toHaveLength(2)
  })

  it('keeps every property of the value it repairs', () => {
    const document = {
      root: { type: 'root', children: [paragraph('kept'), truncatedHeading], direction: null, indent: 0, version: 1 },
    }

    const repaired = repairTruncatedLexicalResult(document, validate) as any

    expect(repaired.root).toMatchObject({ type: 'root', direction: null, indent: 0, version: 1 })
  })

  it('cannot repair a value carrying a property the schema forbids', () => {
    // `additionalProperties: false` applies to the root as well - normalizing a value before
    // validating it therefore breaks every repair attempt, which is why this must never happen.
    const document = {
      root: { type: 'root', children: [paragraph('kept'), truncatedHeading], format: '' },
    }

    expect(repairTruncatedLexicalResult(document, validate)).toBeNull()
  })

  it('gives up instead of trimming a result that is broken throughout', () => {
    const document = documentWith([
      truncatedHeading,
      truncatedHeading,
      truncatedHeading,
      truncatedHeading,
    ])

    expect(repairTruncatedLexicalResult(document, validate)).toBeNull()
  })

  it('never empties the document', () => {
    expect(repairTruncatedLexicalResult(documentWith([truncatedHeading]), validate)).toBeNull()
  })

  it('returns null for a value that is not a Lexical state', () => {
    expect(repairTruncatedLexicalResult({ notARoot: true }, validate)).toBeNull()
    expect(repairTruncatedLexicalResult({ root: { type: 'root' } }, validate)).toBeNull()
  })
})
