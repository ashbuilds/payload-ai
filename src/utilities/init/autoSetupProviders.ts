import type { Payload } from 'payload'

import type { PluginConfig } from '../../types.js'

import { anthropicBlock } from '../../ai/providers/blocks/anthropic.js'
import { elevenlabsBlock } from '../../ai/providers/blocks/elevenlabs.js'
import { falBlock } from '../../ai/providers/blocks/fal.js'
import { googleBlock } from '../../ai/providers/blocks/google.js'
import { openaiBlock } from '../../ai/providers/blocks/openai.js'
import { xaiBlock } from '../../ai/providers/blocks/xai.js'
import { flattenObject } from '../../ai/utilities/flattenObject.js'

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
    if (process.env[providerKeys.openai]) {
      const isAlreadyConfigured = existing.providers?.find((p: any) => p.blockType === 'openai')
      if (!isAlreadyConfigured) {
        providersArray.push({
          apiKey: process.env[providerKeys.openai],
          blockType: 'openai',
          enabled: true,
          models: findModelsDefault(openaiBlock),
        })
        initializedAny = true
      }
    }

    // Google Setup
    const googleKey = process.env[providerKeys.google[0]] || process.env[providerKeys.google[1]]
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
    if (process.env[providerKeys.anthropic]) {
      const isAlreadyConfigured = existing.providers?.find((p: any) => p.blockType === 'anthropic')
      if (!isAlreadyConfigured) {
        providersArray.push({
          apiKey: process.env[providerKeys.anthropic],
          blockType: 'anthropic',
          enabled: true,
          models: findModelsDefault(anthropicBlock),
        })
        initializedAny = true
      }
    }

    // ElevenLabs Setup
    if (process.env[providerKeys.elevenlabs]) {
      const isAlreadyConfigured = existing.providers?.find((p: any) => p.blockType === 'elevenlabs')
      if (!isAlreadyConfigured) {
        providersArray.push({
          apiKey: process.env[providerKeys.elevenlabs],
          blockType: 'elevenlabs',
          enabled: true,
          models: findModelsDefault(elevenlabsBlock),
        })
        initializedAny = true
      }
    }

    // XAI Setup
    if (process.env[providerKeys.xai]) {
      const isAlreadyConfigured = existing.providers?.find((p: any) => p.blockType === 'xai')
      if (!isAlreadyConfigured) {
        providersArray.push({
          apiKey: process.env[providerKeys.xai],
          blockType: 'xai',
          enabled: true,
          models: findModelsDefault(xaiBlock),
        })
        initializedAny = true
      }
    }

    // Fal Setup
    if (process.env[providerKeys.fal]) {
      const isAlreadyConfigured = existing.providers?.find((p: any) => p.blockType === 'fal')
      if (!isAlreadyConfigured) {
        providersArray.push({
          apiKey: process.env[providerKeys.fal],
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
      for (const [providerName, options] of Object.entries(providerOptions || {})) {
        if (!options?.text) {
          continue
        }
        const providerKey = String(providerName).replace(/\W/g, '_')
        const fieldName = `po_${providerKey}`
        const existingOpts = existing.defaults?.text?.[fieldName]
        if (Array.isArray(existingOpts) && existingOpts.length > 0) {
          continue
        }
        const textOpts = flattenObject(options.text, '', providerName)
        if (textOpts.length > 0) {
          defaults.text[fieldName] = textOpts
          initializedAny = true
        }
      }

      if (!defaults.image.provider && config.generationDefaults?.image) {
        defaults.image.provider = config.generationDefaults.image.provider
        defaults.image.model = config.generationDefaults.image.model
        initializedAny = true
      }

      for (const [providerName, options] of Object.entries(providerOptions || {})) {
        if (!options?.image) {
          continue
        }
        const providerKey = String(providerName).replace(/\W/g, '_')
        const fieldName = `po_${providerKey}`
        const existingOpts = existing.defaults?.image?.[fieldName]
        if (Array.isArray(existingOpts) && existingOpts.length > 0) {
          continue
        }
        const imageOpts = flattenObject(options.image, '', providerName)
        if (imageOpts.length > 0) {
          defaults.image[fieldName] = imageOpts
          initializedAny = true
        }
      }

      if (!defaults.tts.provider && config.generationDefaults?.tts) {
        defaults.tts.provider = config.generationDefaults.tts.provider
        defaults.tts.model = config.generationDefaults.tts.model
        defaults.tts.voice = config.generationDefaults.tts.voice
        initializedAny = true
      }
      for (const [providerName, options] of Object.entries(providerOptions || {})) {
        if (!options?.tts) {
          continue
        }
        const providerKey = String(providerName).replace(/\W/g, '_')
        const fieldName = `po_${providerKey}`
        const existingOpts = existing.defaults?.tts?.[fieldName]
        if (Array.isArray(existingOpts) && existingOpts.length > 0) {
          continue
        }
        const ttsOpts = flattenObject(options.tts, '', providerName)
        if (ttsOpts.length > 0) {
          defaults.tts[fieldName] = ttsOpts
          initializedAny = true
        }
      }

      if (!defaults.video.provider && config.generationDefaults?.video) {
        defaults.video.provider = config.generationDefaults.video.provider
        defaults.video.model = config.generationDefaults.video.model
        initializedAny = true
      }
      for (const [providerName, options] of Object.entries(providerOptions || {})) {
        if (!options?.video) {
          continue
        }
        const providerKey = String(providerName).replace(/\W/g, '_')
        const fieldName = `po_${providerKey}`
        const existingOpts = existing.defaults?.video?.[fieldName]
        if (Array.isArray(existingOpts) && existingOpts.length > 0) {
          continue
        }
        const videoOpts = flattenObject(options.video, '', providerName)
        if (videoOpts.length > 0) {
          defaults.video[fieldName] = videoOpts
          initializedAny = true
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
