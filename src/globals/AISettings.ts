import type { GlobalConfig, GroupField } from 'payload'

import type { PluginConfig } from '../types.js'

import { PLUGIN_SETTINGS_GLOBAL } from '../defaults.js'
import { getGenerationModels } from '../utilities/getGenerationModels.js'

export const aiSettingsGlobal = (pluginConfig: PluginConfig): GlobalConfig => {
  const models = (getGenerationModels(pluginConfig) ?? []).map((m) => ({
    id: m.id,
    label: m.name,
    output: m.output,
    supportsPromptOptimization: m.supportsPromptOptimization ?? false,
  }))

  const featuresGroup: GroupField = {
    name: 'features',
    type: 'group',
    fields: [
      {
        name: 'enableText',
        type: 'checkbox',
        defaultValue: true,
        label: 'Enable Text Generation',
      },
      {
        name: 'enableImage',
        type: 'checkbox',
        defaultValue: true,
        label: 'Enable Image Generation',
      },
      {
        name: 'enableVoice',
        type: 'checkbox',
        defaultValue: true,
        label: 'Enable Voice Generation',
      },
    ],
    label: 'Features',
  }

  return {
    slug: PLUGIN_SETTINGS_GLOBAL,
    access: {
      read: async ({ req }) => {
        // Allow read by default for authenticated users; fallback to pluginConfig.access.settings if provided
        if (pluginConfig?.access?.settings) {
          try {
            return await pluginConfig.access.settings({ req })
          } catch {
            return !!req.user
          }
        }
        return !!req.user
      },
      update: async ({ req }) => {
        if (pluginConfig?.access?.settings) {
          try {
            return await pluginConfig.access.settings({ req })
          } catch {
            return !!req.user
          }
        }
        return !!req.user
      },
    },
    admin: {
      group: 'Plugins',
      hidden: true,
    },
    fields: [
      {
        name: 'defaultModelId',
        type: 'select',
        admin: {
          description: 'Default model for AI text-oriented generation.',
        },
        label: 'Default Model',
        options: models.map((m) => ({ label: m.label, value: m.id })),
      },
      featuresGroup,
      {
        name: 'defaultSystemPrompt',
        type: 'textarea',
        admin: {
          description: 'Global system prompt applied by default when composing content.',
        },
        label: 'Default System Prompt',
      },
      {
        name: 'temperature',
        type: 'number',
        admin: {
          description: 'Controls randomness. Range 0–2 (default: 1).',
        },
        defaultValue: 1,
        label: 'Temperature',
      },
      {
        name: 'enabledLanguages',
        type: 'array',
        fields: [
          {
            name: 'code',
            type: 'text',
            admin: {
              placeholder: 'e.g. en, en-US, zh-CN',
            },
            label: 'Locale Code',
          },
        ],
        label: 'Enabled Languages',
        labels: {
          plural: 'Languages',
          singular: 'Language',
        },
      },
    ],
    label: 'AI Settings',
  }
}
