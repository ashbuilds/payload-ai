import { describe, expect, it } from 'vitest'

import { renderTemplate } from './renderTemplate.js'

describe('renderTemplate array row context', () => {
  const values = {
    name: 'Celeste Wayfinder',
    voices: [
      {
        primaryText: 'First voice line',
        speech: null,
      },
      {
        primaryText: 'Second voice line',
        speech: null,
      },
    ],
  }

  it('resolves current.* against the active array row', async () => {
    await expect(
      renderTemplate('{{current.primaryText}}', values, {
        fieldPath: 'voices.1.speech',
        schemaPath: 'characters.voices.speech',
      }),
    ).resolves.toBe('Second voice line')
  })

  it('keeps full-path array references working for the active row', async () => {
    await expect(
      renderTemplate('{{voices.primaryText}}', values, {
        fieldPath: 'voices.1.speech',
        schemaPath: 'characters.voices.speech',
      }),
    ).resolves.toBe('Second voice line')
  })

  it('still allows iteration over the full array', async () => {
    await expect(
      renderTemplate('{{#each voices}}{{primaryText}}|{{/each}}', values, {
        fieldPath: 'voices.1.speech',
        schemaPath: 'characters.voices.speech',
      }),
    ).resolves.toBe('First voice line|Second voice line|')
  })

  it('supports Payload _index-* array paths from the admin form', async () => {
    await expect(
      renderTemplate('{{current.primaryText}}', values, {
        fieldPath: 'voices._index-1.speech',
        schemaPath: 'characters.voices.speech',
      }),
    ).resolves.toBe('Second voice line')
  })

  it('keeps nested full paths working when the array is inside a group', async () => {
    await expect(
      renderTemplate(
        '{{profile.voices.primaryText}}',
        {
          profile: values,
        },
        {
          fieldPath: 'profile.voices.1.speech',
          schemaPath: 'characters.profile.voices.speech',
        },
      ),
    ).resolves.toBe('Second voice line')
  })
})
