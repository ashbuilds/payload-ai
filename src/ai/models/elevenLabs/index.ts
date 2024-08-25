import type { Field, File } from 'payload'

import type { GenerationConfig } from '../../../types.js'

import { SelectField } from '../../../fields/SelectField/SelectField.js'
import { generateFileNameByPrompt } from '../../utils/generateFileNameByPrompt.js'
import { generateVoice } from './generateVoice.js'
import { getAllVoices } from './voices.js'

const { voices = [] } = await getAllVoices()

const voiceOptions = voices.map((voice) => {
  return {
    label: voice.name,
    value: voice.voice_id,
    ...voice,
  }
})

const fieldVoiceOptions = voiceOptions.map((option) => {
  return {
    label: option.name,
    value: option.voice_id,
  }
})

const fields: Field[] = [
  {
    type: 'collapsible',
    admin: {
      initCollapsed: false,
    },
    fields: [
      {
        name: 'stability',
        type: 'number',
        defaultValue: 0.5,
        label: 'Stability',
        max: 1,
        min: 0,
        required: true,
      },
      {
        name: 'similarity_boost',
        type: 'number',
        defaultValue: 0.5,
        label: 'Similarity Boost',
        max: 1,
        min: 0,
        required: true,
      },
      {
        name: 'style',
        type: 'number',
        defaultValue: 0.5,
        label: 'Style',
        max: 1,
        min: 0,
      },
      {
        name: 'use_speaker_boost',
        type: 'checkbox',
        label: 'Use Speaker Boost',
      },
    ],
    label: 'Voice Settings',
  },
  {
    name: 'seed',
    type: 'number',
    label: 'Seed',
  },
  {
    type: 'row',
    fields: [
      {
        name: 'previous_text',
        type: 'textarea',
        label: 'Previous Text',
      },
      {
        name: 'next_text',
        type: 'textarea',
        label: 'Next Text',
      },
    ],
  },
]

if (voiceOptions.length) {
  fields.unshift({
    name: 'voice_id',
    type: 'select',
    admin: {
      components: {
        Field: SelectField,
      },
      custom: {
        options: voiceOptions,
      },
    },
    defaultValue: voiceOptions[0]?.voice_id,
    label: 'Voice',
    options: fieldVoiceOptions,
    required: true,
    validate: () => true,
  })
}

export const ElevenLabsConfig: GenerationConfig = {
  models: [
    {
      id: 'elevenlabs/multilingual-v2',
      name: 'ElevenLabs Multilingual v2',
      fields: ['upload'],
      handler: async (text: string, options) => {
        const voiceData = await generateVoice(text, options)
        return {
          data: {
            alt: 'voice over',
          },
          file: {
            name: `voice_${generateFileNameByPrompt(text)}.mp3`,
            data: voiceData.buffer,
            mimetype: 'audio/mp3',
            size: voiceData.buffer.byteLength,
          } as File,
        }
      },
      output: 'audio',
      settings: {
        name: 'elevenlabs-multilingual-v2-settings',
        type: 'group',
        admin: {
          condition: (data) => {
            return data['model-id'] === 'elevenlabs/multilingual-v2'
          },
        },
        fields,
        label: 'ElevenLabs Multilingual v2 Settings',
      },
    },
  ],
  provider: 'ElevenLabs',
}
