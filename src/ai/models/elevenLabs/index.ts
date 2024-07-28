import type { File } from 'payload'

import type { GenerationConfig } from '../../../types.js'

import { PromptEditorField } from '../../../fields/PromptEditorField/PromptEditorField.js'
import { SelectField } from '../../../fields/SelectField/SelectField.js'
import { generateFileNameByPrompt } from '../../utils/generateFileNameByPrompt.js'
import { generateVoice } from './generateVoice.js'
import { getAllVoices } from './voices.js'

//TODO: Add prompt optimisation for ElevenLabs models

const { voices = [] } = {
  voices: [
    {
      name: 'en-US-Wavenet-A',
      language_code: 'en-US',
      voice_id: 'en-US-Wavenet-A',
    },
  ],
} // await getAllVoices()

const voiceOptions = voices.map((voice) => {
  return {
    label: voice.name,
    value: voice.voice_id,
    ...voice,
  }
})

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
            // alt: text.alt,
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
        fields: [
          {
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
            defaultValue: voiceOptions[0].voice_id,
            label: 'Voice',
            options: voiceOptions.map((option) => {
              return {
                label: option.name,
                value: option.voice_id,
              }
            }),
            required: true,
            validate: () => true,
          },
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
                // admin: {
                //   components: {
                //     Field: PromptTextareaField,
                //   },
                // },
                label: 'Previous Text',
              },
              {
                name: 'next_text',
                type: 'textarea',
                // admin: {
                //   components: {
                //     Field: PromptTextareaField,
                //   },
                // },
                label: 'Next Text',
              },
            ],
          },
        ],
        label: 'ElevenLabs Multilingual v2 Settings',
      },
    },
  ],
  provider: 'ElevenLabs',
}
