import type { GenerationConfig } from '../../types.js'

export const TTSConfig: GenerationConfig = {
  models: [
    {
      id: 'tts',
      name: 'Text-to-Speech',
      fields: ['upload'],
      output: 'audio',
      settings: {
        name: 'tts-settings',
        type: 'group',
        admin: {
          condition(data: any) {
            return data['model-id'] === 'tts'
          },
        },
        fields: [
          {
            name: 'provider',
            type: 'text',
            admin: {
              components: {
                Field: '@ai-stack/payloadcms/client#DynamicProviderSelect',
              },
            },
            defaultValue: 'openai',
            label: 'Provider',
          },
          {
            name: 'model',
            type: 'text',
            admin: {
              components: {
                Field: '@ai-stack/payloadcms/client#DynamicModelSelect',
              },
            },
            defaultValue: 'tts-1',
            label: 'Model',
          },

          // OpenAI-specific
          {
            type: 'collapsible',
            admin: {
              condition: (_data: any, siblingData: any) => siblingData?.provider === 'openai',
              initCollapsed: false,
            },
            fields: [
              {
                name: 'voice',
                type: 'select',
                defaultValue: 'alloy',
                label: 'Voice',
                options: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
              },
              {
                name: 'response_format',
                type: 'select',
                defaultValue: 'mp3',
                label: 'Response Format',
                options: ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'],
              },
              {
                name: 'speed',
                type: 'number',
                defaultValue: 1,
                label: 'Speed',
                max: 4,
                min: 0.25,
              },
            ],
            label: 'OpenAI Settings',
          },

          // ElevenLabs-specific
          {
            type: 'collapsible',
            admin: {
              condition: (_data: any, siblingData: any) => siblingData?.provider === 'elevenlabs',
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
                required: false,
              },
              {
                name: 'similarity_boost',
                type: 'number',
                defaultValue: 0.5,
                label: 'Similarity Boost',
                max: 1,
                min: 0,
                required: false,
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
            ],
            label: 'ElevenLabs Settings',
          },
        ],
        label: 'Text-to-Speech Settings',
      } as any,
    },
  ],
  provider: 'TTS',
}
