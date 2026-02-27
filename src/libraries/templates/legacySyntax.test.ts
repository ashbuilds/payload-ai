import { describe, expect, it } from 'vitest'

import {
  convertLegacyTemplateToLiquid,
  convertLiquidTemplateToLegacySuggestions,
  isLegacyBlockExpression,
  isLiquidBlockExpression,
  usesLegacyToHTMLHelper,
} from './legacySyntax.js'

describe('convertLegacyTemplateToLiquid', () => {
  it('sanitizes mention shorthand syntax', () => {
    expect(convertLegacyTemplateToLiquid('Name: {{ #title }}')).toBe('Name: {{ title }}')
  })

  it('converts toHTML helper to liquid filter syntax', () => {
    expect(convertLegacyTemplateToLiquid('HTML: {{toHTML details}}')).toBe(
      "HTML: {{ details | toHTML: 'details' }}",
    )
  })

  it('converts if/else blocks', () => {
    const source = '{{#if title}}Yes{{else}}No{{/if}}'
    expect(convertLegacyTemplateToLiquid(source)).toBe('{% if title %}Yes{% else %}No{% endif %}')
  })

  it('converts each blocks with loop aliases', () => {
    const source = '{{#each items}}{{@index}}: {{this.name}}{{/each}}'
    expect(convertLegacyTemplateToLiquid(source)).toBe(
      '{% for __item0 in items %}{{ forloop.index0 }}: {{ __item0.name }}{% endfor %}',
    )
  })

  it('converts with blocks with scoped assignments', () => {
    const source = '{{#with author}}{{name}}{{/with}}'
    expect(convertLegacyTemplateToLiquid(source)).toBe(
      '{% assign __with0 = author %}{% if __with0 %}{{ __with0.name }}{% endif %}',
    )
  })

  it('normalizes nested template braces from mention insertion', () => {
    const source = '{{toHTML {{content}}}}'
    expect(convertLegacyTemplateToLiquid(source)).toBe("{{ content | toHTML: 'content' }}")
  })
})

describe('template syntax helpers', () => {
  it('detects legacy and liquid block syntax', () => {
    expect(isLegacyBlockExpression('{{#if title}}x{{/if}}')).toBe(true)
    expect(isLiquidBlockExpression('{% if title %}x{% endif %}')).toBe(true)
  })

  it('detects legacy toHTML helper usage', () => {
    expect(usesLegacyToHTMLHelper('{{toHTML details}}')).toBe(true)
    expect(usesLegacyToHTMLHelper('{{ details | toHTML }}')).toBe(false)
  })

  it('converts liquid toHTML filter back to legacy suggestion format', () => {
    expect(convertLiquidTemplateToLegacySuggestions("{{ details | toHTML: 'details' }}")).toBe(
      '{{toHTML details}}',
    )
  })
})
