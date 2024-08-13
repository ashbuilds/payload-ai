import type { NestedKeysStripped } from '@payloadcms/translations'

export const translations = {
  en: {
    $schema: './translation-schema.json',
    'ai-plugin': {},
  },
  es: {
    $schema: './translation-schema.json',
    'ai-plugin': {},
  },
  fa: {
    $schema: './translation-schema.json',
    'ai-plugin': {},
  },
  fr: {
    $schema: './translation-schema.json',
    'ai-plugin': {},
  },
  nb: {
    $schema: './translation-schema.json',
    'ai-plugin': {},
  },
  pl: {
    $schema: './translation-schema.json',
    'ai-plugin': {},
  },
  ru: {
    $schema: './translation-schema.json',
    'ai-plugin': {},
  },
  uk: {
    $schema: './translation-schema.json',
    'ai-plugin': {},
  },
}

export type PluginAITranslations = typeof translations.en

export type PluginAITranslationKeys = NestedKeysStripped<PluginAITranslations>
