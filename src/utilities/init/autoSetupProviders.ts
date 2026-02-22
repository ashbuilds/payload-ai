import type { Payload } from 'payload'

import type { PluginConfig } from '../../types.js'

import { flattenObject } from '../../ai/utilities/flattenObject.js'
import { openaiBlock } from '../../ai/providers/blocks/openai.js'
import { anthropicBlock } from '../../ai/providers/blocks/anthropic.js'
import { googleBlock } from '../../ai/providers/blocks/google.js'
import { elevenlabsBlock } from '../../ai/providers/blocks/elevenlabs.js'
import { xaiBlock } from '../../ai/providers/blocks/xai.js'
import { falBlock } from '../../ai/providers/blocks/fal.js'

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
  if (block?.fields) search(block.fields)
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
        
        if (!defaults.text.provider) {
          defaults.text.provider = 'openai'
          defaults.text.model = 'gpt-4o'
          defaults.text.providerOptions = providerOptions?.openai?.text 
            ? flattenObject(providerOptions.openai.text) : undefined
        }
        if (!defaults.image.provider) {
          defaults.image.provider = 'openai'
          defaults.image.model = 'dall-e-3'
          defaults.image.providerOptions = providerOptions?.openai?.image 
            ? flattenObject(providerOptions.openai.image) : undefined
        }
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
         
         if (!defaults.text.provider) {
            defaults.text.provider = 'google'
            defaults.text.model = 'gemini-2.5-flash'
            defaults.text.providerOptions = providerOptions?.google?.text 
              ? flattenObject(providerOptions.google.text) : undefined
         }
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
        
        if (!defaults.text.provider) {
          defaults.text.provider = 'anthropic'
          defaults.text.model = 'claude-3-5-sonnet-latest'
          defaults.text.providerOptions = providerOptions?.anthropic?.text 
            ? flattenObject(providerOptions.anthropic.text) : undefined
        }
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
        
        if (!defaults.tts.provider) {
          defaults.tts.provider = 'elevenlabs'
          defaults.tts.model = 'eleven_turbo_v2_5'
          defaults.tts.providerOptions = providerOptions?.elevenlabs?.tts 
            ? flattenObject(providerOptions.elevenlabs.tts) : undefined
        }
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

        if (!defaults.image.provider) {
          defaults.image.provider = 'fal'
          defaults.image.model = 'fal-ai/flux-pro/v1.1'
          defaults.image.providerOptions = providerOptions?.fal?.image 
            ? flattenObject(providerOptions.fal.image) : undefined
        }
        initializedAny = true
      }
    }

    if (initializedAny) {
      await payload.updateGlobal({
        slug: 'ai-providers',
        data: {
          defaults,
          providers: [...(existing.providers || []), ...providersArray],
        },
      })
      payload.logger.info(`— AI Plugin: Auto-setup complete. Handled defaults for seeded providers.`)
    }
  } catch (error) {
    payload.logger.warn(
      `— AI Plugin: Failed to auto-setup providers: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}
