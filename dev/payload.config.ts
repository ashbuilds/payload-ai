import { payloadAiPlugin } from '@ai-stack/payloadcms'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { de } from '@payloadcms/translations/languages/de'
import { en } from '@payloadcms/translations/languages/en'
import { es } from '@payloadcms/translations/languages/es'
import { fr } from '@payloadcms/translations/languages/fr'
import { ja } from '@payloadcms/translations/languages/ja'
import { nl } from '@payloadcms/translations/languages/nl'
import { pt } from '@payloadcms/translations/languages/pt'
import { th } from '@payloadcms/translations/languages/th'
import { zh } from '@payloadcms/translations/languages/zh'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { ArrayTestCases } from './collections/ArrayTestCases.js'
import { Characters } from './collections/Characters.js'
import { Media } from './collections/Media.js'
import { Posts } from './collections/Posts.js'
import { Products } from './collections/Products.js'
import { Users } from './collections/Users.js'
import { testEmailAdapter } from './helpers/testEmailAdapter.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

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
    collections: [Media, Posts, Characters, ArrayTestCases, Users, Products],
    db: sqliteAdapter({
      client: {
        url: process.env.DATABASE_URI || `file:${path.resolve(dirname, 'dev.db')}`,
      },
    }),
    editor: lexicalEditor(),
    email: testEmailAdapter,
    i18n: {
      fallbackLanguage: 'en',
      supportedLanguages: {
        de,
        en,
        es,
        fr,
        ja,
        nl,
        pt,
        th,
        zh,
      } as any,
    },
    localization: {
      defaultLocale: 'en',
      fallback: true,
      locales: ['en', 'fr', 'th', 'nl', 'de'],
    },
    plugins: [
      payloadAiPlugin({
        debugging: true,
        disableSponsorMessage: false,
        providerOptions: {
          google: {
            image: {
              aspectRatio: ['1:1', '3:4', '4:3', '9:16', '16:9'],
              imageSize: ['1K', '2K', '4K'],
            },
            media_resolution: [
              'media_resolution_low',
              'media_resolution_medium',
              'media_resolution_high',
              'media_resolution_ultra_high',
            ],
          },
        },
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
