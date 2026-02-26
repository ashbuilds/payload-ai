import type { Payload } from 'payload'

import type { PluginConfig } from '../../types.js'

import { anthropicBlock } from '../../ai/providers/blocks/anthropic.js'
import { elevenlabsBlock } from '../../ai/providers/blocks/elevenlabs.js'
import { falBlock } from '../../ai/providers/blocks/fal.js'
import { googleBlock } from '../../ai/providers/blocks/google.js'
import { openaiBlock } from '../../ai/providers/blocks/openai.js'
import { xaiBlock } from '../../ai/providers/blocks/xai.js'


const findModelsDefault = (block: any): any[] => {
  let defaultModels: any[] = []
  const search = (fields: any[]): boolean => {
    for (const f of fields) {
      if (f.name === 'models' && Array.isArray(f.defaultValue)) {
        defaultModels = f.defaultValue
        return true
      }
      if (f.tabs) {
        for (const t of f.tabs) {
          if (search(t.fields)) {
            return true
          }
        }
      }
      if (f.fields) {
        if (search(f.fields)) {
          return true
        }
      }
    }
    return false
  }
  if (block?.fields) {
    search(block.fields)
  }
  return defaultModels
}

const providerKeys = {
  anthropic: 'ANTHROPIC_API_KEY',
  elevenlabs: 'ELEVENLABS_API_KEY',
  fal: 'FAL_KEY',
  google: ['GOOGLE_GENERATIVE_AI_API_KEY', 'GEMINI_API_KEY'],
  openai: 'OPENAI_API_KEY',
  xai: 'XAI_API_KEY',
}

export const autoSetupProviders = async (payload: Payload, config: PluginConfig) => {
  try {
    const getEnvValue = (key: string): string | undefined => {
      const fromResolver = config.getEnv?.(key)
      if (typeof fromResolver === 'string' && fromResolver.length > 0) {
        return fromResolver
      }

      const fromMap = config.env?.[key]
      if (typeof fromMap === 'string' && fromMap.length > 0) {
        return fromMap
      }

      const fromProcessEnv = process.env[key]
      if (typeof fromProcessEnv === 'string' && fromProcessEnv.length > 0) {
        return fromProcessEnv
      }

      return undefined
    }

    const existing = await payload.findGlobal({ slug: 'ai-providers' })

    // Build the default array structure
    let initializedAny = false
    const providersArray: any[] = []
    const defaults = {
      image: existing.defaults?.image || { model: '', provider: '' },
      text: existing.defaults?.text || { model: '', provider: '' },
      tts: existing.defaults?.tts || { model: '', provider: '' },
      video: existing.defaults?.video || { model: '', provider: '' },
    }

    const { providerOptions } = config

    // OpenAI Setup
    const openaiKey = getEnvValue(providerKeys.openai)
    if (openaiKey) {
      const isAlreadyConfigured = existing.providers?.find((p: any) => p.blockType === 'openai')
      if (!isAlreadyConfigured) {
        providersArray.push({
          apiKey: openaiKey,
          blockType: 'openai',
          enabled: true,
          models: findModelsDefault(openaiBlock),
        })
        initializedAny = true
      }
    }

    // Google Setup
    const googleKey = getEnvValue(providerKeys.google[0]) || getEnvValue(providerKeys.google[1])
    if (googleKey) {
      const isAlreadyConfigured = existing.providers?.find((p: any) => p.blockType === 'google')
      if (!isAlreadyConfigured) {
        providersArray.push({
          apiKey: googleKey,
          blockType: 'google',
          enabled: true,
          models: findModelsDefault(googleBlock),
        })
        initializedAny = true
      }
    }

    // Anthropic Setup
    const anthropicKey = getEnvValue(providerKeys.anthropic)
    if (anthropicKey) {
      const isAlreadyConfigured = existing.providers?.find((p: any) => p.blockType === 'anthropic')
      if (!isAlreadyConfigured) {
        providersArray.push({
          apiKey: anthropicKey,
          blockType: 'anthropic',
          enabled: true,
          models: findModelsDefault(anthropicBlock),
        })
        initializedAny = true
      }
    }

    // ElevenLabs Setup
    const elevenlabsKey = getEnvValue(providerKeys.elevenlabs)
    if (elevenlabsKey) {
      const isAlreadyConfigured = existing.providers?.find((p: any) => p.blockType === 'elevenlabs')
      if (!isAlreadyConfigured) {
        providersArray.push({
          apiKey: elevenlabsKey,
          blockType: 'elevenlabs',
          enabled: true,
          models: findModelsDefault(elevenlabsBlock),
        })
        initializedAny = true
      }
    }

    // XAI Setup
    const xaiKey = getEnvValue(providerKeys.xai)
    if (xaiKey) {
      const isAlreadyConfigured = existing.providers?.find((p: any) => p.blockType === 'xai')
      if (!isAlreadyConfigured) {
        providersArray.push({
          apiKey: xaiKey,
          blockType: 'xai',
          enabled: true,
          models: findModelsDefault(xaiBlock),
        })
        initializedAny = true
      }
    }

    // Fal Setup
    const falKey = getEnvValue(providerKeys.fal)
    if (falKey) {
      const isAlreadyConfigured = existing.providers?.find((p: any) => p.blockType === 'fal')
      if (!isAlreadyConfigured) {
        providersArray.push({
          apiKey: falKey,
          blockType: 'fal',
          enabled: true,
          models: findModelsDefault(falBlock),
        })
        initializedAny = true
      }
    }

    // Setup defaults globally regardless of whether providers were newly added or not
    const configuredProviders = [...(existing.providers || []), ...providersArray]
    if (configuredProviders.length > 0) {
      if (!defaults.text.provider && config.generationDefaults?.text) {
        defaults.text.provider = config.generationDefaults.text.provider
        defaults.text.model = config.generationDefaults.text.model
        initializedAny = true
      }
      
      const providerSchemaByProvider: Record<string, unknown> = {}
      for (const [providerName, options] of Object.entries(providerOptions || {})) {
        if (options && typeof options === 'object' && !Array.isArray(options)) {
          providerSchemaByProvider[providerName] = options
        }
      }

      if (!defaults.image.provider && config.generationDefaults?.image) {
        defaults.image.provider = config.generationDefaults.image.provider
        defaults.image.model = config.generationDefaults.image.model
        initializedAny = true
      }

      if (!defaults.tts.provider && config.generationDefaults?.tts) {
        defaults.tts.provider = config.generationDefaults.tts.provider
        defaults.tts.model = config.generationDefaults.tts.model
        defaults.tts.voice = config.generationDefaults.tts.voice
        initializedAny = true
      }

      if (!defaults.video.provider && config.generationDefaults?.video) {
        defaults.video.provider = config.generationDefaults.video.provider
        defaults.video.model = config.generationDefaults.video.model
        initializedAny = true
      }

      if (Object.keys(providerSchemaByProvider).length > 0) {
        const schemaForUseCases = JSON.stringify(providerSchemaByProvider)
        const useCases: Array<'image' | 'text' | 'tts' | 'video'> = ['text', 'image', 'tts', 'video']

        for (const useCase of useCases) {
          if (JSON.stringify(defaults[useCase].schema) !== schemaForUseCases) {
            defaults[useCase].schema = JSON.parse(schemaForUseCases)
            initializedAny = true
          }
        }
      }
    }

    if (initializedAny) {
      await payload.updateGlobal({
        slug: 'ai-providers',
        data: {
          defaults,
          providers: configuredProviders,
        },
      })
      payload.logger.info(
        `— AI Plugin: Auto-setup complete. Handled defaults for seeded providers.`,
      )
    }
  } catch (error) {
    payload.logger.warn(
      `— AI Plugin: Failed to auto-setup providers: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
