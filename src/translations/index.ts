import type { NestedKeysStripped } from '@payloadcms/translations'

const englishTranslations = {
  clickToStop: 'Click to stop',
  compose: 'Compose',
  composing: 'Composing',
  expand: 'Expand',
  expanding: 'Expanding',
  failedToGenerate: 'Failed to generate: {{message}}',
  promptEditorPlaceholder: 'Type your prompt using {{ fieldName }} variables...',
  proofread: 'Proofread',
  proofreading: 'Proofreading',
  rephrase: 'Rephrase',
  rephrasing: 'Rephrasing',
  richTextApplyFailed: 'Generated rich text could not be applied to the editor.',
  search: 'Search...',
  settings: 'Settings',
  simplify: 'Simplify',
  simplifying: 'Simplifying',
  summarize: 'Summarize',
  summarizing: 'Summarizing',
  translate: 'Translate',
  translating: 'Translating',
}

const englishFallback = () => ({
  $schema: './translation-schema.json',
  'ai-plugin': { ...englishTranslations },
})

const en = englishFallback()

const de = {
  $schema: './translation-schema.json',
  'ai-plugin': {
    clickToStop: 'Klicken zum Stoppen',
    compose: 'Verfassen',
    composing: 'Wird verfasst',
    expand: 'Erweitern',
    expanding: 'Wird erweitert',
    failedToGenerate: 'Generierung fehlgeschlagen: {{message}}',
    promptEditorPlaceholder: 'Prompt mit {{ fieldName }} Variablen eingeben...',
    proofread: 'Korrekturlesen',
    proofreading: 'Wird korrekturgelesen',
    rephrase: 'Umformulieren',
    rephrasing: 'Wird umformuliert',
    richTextApplyFailed: 'Der generierte Rich Text konnte nicht auf den Editor angewendet werden.',
    search: 'Suchen...',
    settings: 'Einstellungen',
    simplify: 'Vereinfachen',
    simplifying: 'Wird vereinfacht',
    summarize: 'Zusammenfassen',
    summarizing: 'Wird zusammengefasst',
    translate: 'Uebersetzen',
    translating: 'Wird uebersetzt',
  },
}

export const translations = {
  de,
  en,
  es: englishFallback(),
  fa: englishFallback(),
  fr: englishFallback(),
  nb: englishFallback(),
  pl: englishFallback(),
  ru: englishFallback(),
  uk: englishFallback(),
}

export type PluginAITranslations = typeof translations.en

export type PluginAITranslationKeys = NestedKeysStripped<PluginAITranslations>
