import type { File } from 'payload'

import type { GenerationConfig } from '../../types.js'

import { allProviderBlocks } from '../providers/blocks/index.js'
import { getTTSModel } from '../providers/index.js'
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

// Helper to extract models from blocks
const getModelsFromBlocks = (useCase: string) => {
  const models: { label: string; value: string }[] = []
  
  allProviderBlocks.forEach((block) => {
    const providerId = block.slug
    const modelsField = block.fields.find((f: any) => f.name === 'models')
    const defaultModels = modelsField && 'defaultValue' in modelsField ? (modelsField.defaultValue as any[]) : []
    
    defaultModels.forEach((m) => {
      if (m.useCase === useCase) {
        models.push({
          label: `${block.labels?.singular || providerId} - ${m.name}`,
          value: m.id,
        })
      }
    })
  })
  
  return models
}

const getTTSProviders = () => {
  return allProviderBlocks
    .filter((block) => {
      const modelsField = block.fields.find((f: any) => f.name === 'models')
      const defaultModels = modelsField && 'defaultValue' in modelsField ? (modelsField.defaultValue as any[]) : []
      return defaultModels.some((m) => m.useCase === 'tts')
    })
    .map((block) => ({
      label: typeof block.labels?.singular === 'string' ? block.labels.singular : block.slug,
      value: block.slug,
    }))
}

export const TTSConfig: GenerationConfig = {
  models: [
    {
      id: 'tts',
      name: 'Text-to-Speech',
      fields: ['upload'],
      handler: async (text: string, options: TTSOptions & { req: any }) => {
        const { req } = options
        const model = await getTTSModel(req.payload, options.provider, options.model || 'tts-1')
        
        throw new Error('Audio generation using registry is pending implementation')
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
            defaultValue: 'openai',
            label: 'Provider',
            options: getTTSProviders(),
          },

          // OpenAI-specific
          {
            type: 'collapsible',
            admin: {
              initCollapsed: false,
              condition: (data: any) => data?.provider === 'openai',
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
              condition: (data: any) => data?.provider === 'elevenlabs',
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
