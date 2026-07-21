import type { Config } from 'payload'

import { payloadAiPlugin } from '@ai-stack/payloadcms'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { de } from '@payloadcms/translations/languages/de'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'
import { fa } from '@payloadcms/translations/languages/fa'
import { fr } from '@payloadcms/translations/languages/fr'
import { nb } from '@payloadcms/translations/languages/nb'
import { pl } from '@payloadcms/translations/languages/pl'
import { ru } from '@payloadcms/translations/languages/ru'
import { uk } from '@payloadcms/translations/languages/uk'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media.js'
import { Posts } from './collections/Posts.js'
import { testEmailAdapter } from './helpers/testEmailAdapter.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

process.loadEnvFile?.(path.resolve(dirname, '.env'))

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const supportedLanguages = {
  de,
  en,
  es,
  fa,
  fr,
  nb,
  pl,
  ru,
  uk,
} as NonNullable<NonNullable<Config['i18n']>['supportedLanguages']>

const buildConfigWithMemoryDB = async () => {

  return buildConfig({
    admin: {
      dependencies: {
        InstructionsProvider: {
          type: 'component',
          path: '@ai-stack/payloadcms/client#InstructionsProvider',
        },
      },
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      Media,
      Posts,
    ],
    db: sqliteAdapter({
      client: {
        url: process.env.DATABASE_URI || `file:${path.resolve(dirname, 'dev.db')}`,
      },
      // Automatically push schema changes in non-production for frictionless dev
      push: process.env.NODE_ENV !== 'production',
    }),
    editor: lexicalEditor(),
    email: testEmailAdapter,
    i18n: {
      fallbackLanguage: 'en',
      supportedLanguages,
    },
    localization: {
      defaultLocale: 'en',
      fallback: true,
      locales: ['en', 'de', 'es', 'fa', 'fr', 'nb', 'pl', 'ru', 'uk'],
    },
    plugins: [
      payloadAiPlugin({
        collections: {
          [Posts.slug]: true,
        },
        debugging: process.env.NODE_ENV !== 'production',
        disableSponsorMessage: false,
        generatePromptOnInit: process.env.NODE_ENV !== 'production',
        mediaUpload: async (result, { collection, request }) => {
          return request.payload.create({
            collection,
            data: result.data,
            file: result.file,
          })
        },
        uploadCollectionSlug: 'media',
      }),
    ],
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    sharp,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  })
}

export default buildConfigWithMemoryDB()
