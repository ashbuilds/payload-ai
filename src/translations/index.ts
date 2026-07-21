import type { NestedKeysStripped } from '@payloadcms/translations'

import { createRequire } from 'node:module'

import type deTranslations from './de.json'
import type enTranslations from './en.json'
import type esTranslations from './es.json'
import type faTranslations from './fa.json'
import type frTranslations from './fr.json'
import type nbTranslations from './nb.json'
import type plTranslations from './pl.json'
import type ruTranslations from './ru.json'
import type ukTranslations from './uk.json'

const require = createRequire(import.meta.url)

const de = require('./de.json') as typeof deTranslations
const en = require('./en.json') as typeof enTranslations
const es = require('./es.json') as typeof esTranslations
const fa = require('./fa.json') as typeof faTranslations
const fr = require('./fr.json') as typeof frTranslations
const nb = require('./nb.json') as typeof nbTranslations
const pl = require('./pl.json') as typeof plTranslations
const ru = require('./ru.json') as typeof ruTranslations
const uk = require('./uk.json') as typeof ukTranslations

export type PluginAITranslations = typeof en

export const translations = {
  de,
  en,
  es,
  fa,
  fr,
  nb,
  pl,
  ru,
  uk,
} satisfies Record<string, PluginAITranslations>

export type PluginAITranslationKeys = NestedKeysStripped<PluginAITranslations>
