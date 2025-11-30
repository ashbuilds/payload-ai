import type { File } from 'payload'

import type { GenerationConfig } from '../../types.js'

import { generateFileNameByPrompt } from '../utils/generateFileNameByPrompt.js'

type TTSProvider = 'elevenlabs' | 'openai'

type TTSOptions = {
  // OpenAI
  model?: 'tts-1' | 'tts-1-hd'

  next_text?: string
  previous_text?: string
  provider: TTSProvider
  response_format?: 'aac' | 'flac' | 'mp3' | 'opus' | 'pcm' | 'wav'

  seed?: number
  similarity_boost?: number
  speed?: number
  stability?: number
  style?: number
  use_speaker_boost?: boolean
  voice?: 'alloy' | 'echo' | 'fable' | 'nova' | 'onyx' | 'shimmer'
  // ElevenLabs
  voice_id?: string
}

function getAudioFileMeta(format: TTSOptions['response_format'] | undefined) {
  const ext = format || 'mp3'
  const mime =
    ext === 'wav'
      ? 'audio/wav'
      : ext === 'flac'
        ? 'audio/flac'
        : ext === 'aac'
          ? 'audio/aac'
          : ext === 'opus'
            ? 'audio/opus'
            : ext === 'pcm'
              ? 'audio/L16'
              : 'audio/mp3'
  return { ext, mime }
}

export const TTSConfig: GenerationConfig = {
  models: [
    {
      id: 'tts',
      name: 'Text-to-Speech',
      fields: ['upload'],
      handler: async (text: string, options: TTSOptions) => {
        throw new Error('Audio generation not yet implemented with registry')
        // if (options.provider === 'openai') {
        //   const result = await generateOpenAIVoice(text, {
        //     model: options.model || 'tts-1',
        //     response_format: options.response_format || 'mp3',
        //     speed: options.speed ?? 1,
        //     voice: options.voice || 'alloy',
        //   } as any)
        //
        //   if (!result?.buffer) {
        //     throw new Error('OpenAI TTS failed to produce audio')
        //   }
        //   const { ext, mime } = getAudioFileMeta(options.response_format)
        //   return {
        //     data: { alt: text },
        //     file: {
        //       name: `voice_${generateFileNameByPrompt(text)}.${ext}`,
        //       data: result.buffer,
        //       mimetype: mime,
        //       size: result.buffer.byteLength,
        //     } as File,
        //   }
        // }
        //
        // // ElevenLabs
        // if (!options.voice_id) {
        //   throw new Error('voice_id is required for ElevenLabs provider')
        // }
        // const result = await generateElevenLabsVoice(text, {
        //   next_text: options.next_text,
        //   previous_text: options.previous_text,
        //   seed: options.seed,
        //   similarity_boost: options.similarity_boost,
        //   stability: options.stability,
        //   style: options.style,
        //   use_speaker_boost: options.use_speaker_boost,
        //   voice_id: options.voice_id,
        // } as any)
        //
        // if (!result?.buffer) {
        //   throw new Error('ElevenLabs TTS failed to produce audio')
        // }
        //
        // return {
        //   data: { alt: 'voice over' },
        //   file: {
        //     name: `voice_${generateFileNameByPrompt(text)}.mp3`,
        //     data: result.buffer,
        //     mimetype: 'audio/mp3',
        //     size: result.buffer.byteLength,
        //   } as File,
        // }
      },
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
            type: 'select',
            defaultValue: (process.env.OPENAI_API_KEY ? 'openai' : 'elevenlabs') as TTSProvider,
            label: 'Provider',
            options: [
              ...(process.env.OPENAI_API_KEY ? [{ label: 'OpenAI', value: 'openai' }] : []),
              ...(process.env.ELEVENLABS_API_KEY
                ? [{ label: 'ElevenLabs', value: 'elevenlabs' }]
                : []),
            ],
          },

          // OpenAI-specific
          {
            type: 'collapsible',
            admin: {
              initCollapsed: false,
            },
            fields: [
              {
                name: 'model',
                type: 'select',
                defaultValue: 'tts-1',
                label: 'OpenAI Model',
                options: ['tts-1', 'tts-1-hd'],
              },
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
              initCollapsed: false,
            },
            fields: [
              // to be implemented properly and dynamically
              // ...(voices.length
              //   ? [
              //       {
              //         name: 'voice_id',
              //         type: 'select',
              //         defaultValue: voices[0]?.voice_id,
              //         label: 'Voice',
              //         options: voices.map((v: any) => ({
              //           label: v.name || v.voice_id,
              //           value: v.voice_id,
              //         })),
              //         required: true,
              //       },
              //     ]
              //   : []),
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
